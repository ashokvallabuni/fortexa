import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { SUPER_ADMIN_ROLE, ALLOWED_REQUEST_ROLES } from '@/utils/auth';
import { isValidUUID } from '@/utils/uuid';
import type { NextRequest } from 'next/server';

async function authorize(req: NextRequest) {
  const token = req.cookies.get('__session')?.value;
  const supabase = createAdminClient();
  let user;
  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) return null;
    user = data.user;
  } catch {
    return null;
  }

  if (
    typeof user.email !== 'string' ||
    user.email.trim().toLowerCase() !== 'ashokvallabhuni28@gmail.com'
  ) {
    return null;
  }

  const { data: roleData, error: roleError } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .eq('role', SUPER_ADMIN_ROLE)
    .maybeSingle();

  if (roleError || !roleData) return null;
  return user;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isValidUUID(id)) {
    return NextResponse.json({ error: 'Invalid request id' }, { status: 400 });
  }

  try {
    const user = await authorize(req);
    if (!user) {
      return NextResponse.json({ error: 'Forbidden: Super Admin required' }, { status: 403 });
    }

    let body: { organization_id?: string; role?: string };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const organizationId = body.organization_id;
    const role = body.role;

    if (!isValidUUID(organizationId) || !ALLOWED_REQUEST_ROLES.includes(role as (typeof ALLOWED_REQUEST_ROLES)[number])) {
      return NextResponse.json({ error: 'organization_id and role are required' }, { status: 400 });
    }

    const adminClient = createAdminClient();
    const { data: requestData, error: requestError } = await adminClient
      .from('access_requests')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (requestError) {
      return NextResponse.json({ error: 'Failed to load access request' }, { status: 500 });
    }

    if (!requestData || requestData.status !== 'PENDING') {
      return NextResponse.json({ error: 'Invalid or already processed request' }, { status: 400 });
    }

    if (typeof requestData.email === 'string' && requestData.email.trim().toLowerCase() === user.email?.trim().toLowerCase()) {
      return NextResponse.json({ error: 'Super Admin cannot approve their own request' }, { status: 400 });
    }

    const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(
      requestData.email,
      { data: { full_name: requestData.full_name } },
    );

    let targetUserId = inviteData?.user?.id;
    if (!targetUserId) {
      const { data: listData, error: listError } = await adminClient.auth.admin.listUsers({
        page: 0,
        perPage: 200,
      });
      if (listError) {
        return NextResponse.json({ error: 'Failed to resolve existing user' }, { status: 500 });
      }
      const found = (listData?.users ?? []).find((u) => u.email === requestData.email);
      if (!found) {
        return NextResponse.json({ error: 'User creation failed and user not found' }, { status: 500 });
      }
      targetUserId = found.id;
    }

    const { error: profileError } = await adminClient.from('profiles').upsert({
      id: targetUserId,
      email: requestData.email,
      display_name: requestData.full_name,
    });
    if (profileError) {
      return NextResponse.json({ error: `Failed to create profile: ${profileError.message}` }, { status: 500 });
    }

    const { error: roleError } = await adminClient.from('user_roles').upsert({
      user_id: targetUserId,
      role,
    });
    if (roleError) {
      return NextResponse.json({ error: `Failed to assign role: ${roleError.message}` }, { status: 500 });
    }

    const { error: orgError } = await adminClient.from('organization_memberships').upsert({
      organization_id: organizationId,
      user_id: targetUserId,
      role,
    });
    if (orgError) {
      return NextResponse.json({ error: `Failed to assign organization: ${orgError.message}` }, { status: 500 });
    }

    const { error: updateError } = await adminClient
      .from('access_requests')
      .update({
        status: 'APPROVED',
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        organization_id: organizationId,
        requested_role: role,
      })
      .eq('id', id);
    if (updateError) {
      return NextResponse.json({ error: 'Failed to update access request' }, { status: 500 });
    }

    const { error: auditError } = await adminClient.from('audit_logs').insert({
      actor_id: user.id,
      action: 'APPROVE_ACCESS_REQUEST',
      resource_type: 'user',
      resource_id: targetUserId,
      detail: { email: requestData.email, role, organization_id: organizationId },
    });
    if (auditError) {
      console.error('Audit log write failed:', auditError.message);
    }

    return NextResponse.json({ success: true, message: 'User approved and invited.' });
  } catch (error: unknown) {
    console.error('Approval error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
