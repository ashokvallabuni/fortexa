import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { PRIMARY_SUPER_ADMIN_EMAIL } from '@/utils/auth';
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

  const email = typeof user.email === 'string' ? user.email.trim().toLowerCase() : null;
  if (email !== PRIMARY_SUPER_ADMIN_EMAIL) {
    return null;
  }

  return user;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isValidUUID(id)) {
    return NextResponse.json({ error: 'Invalid user id' }, { status: 400 });
  }

  try {
    const user = await authorize(req);
    if (!user) {
      return NextResponse.json({ error: 'Forbidden: Super Admin required' }, { status: 403 });
    }

    let body: { organization_id?: string };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const organizationId = body.organization_id;
    if (!isValidUUID(organizationId)) {
      return NextResponse.json({ error: 'Valid organization_id is required' }, { status: 400 });
    }

    const adminClient = createAdminClient();

    const { data: orgCheck, error: orgError } = await adminClient
      .from('organizations')
      .select('id')
      .eq('id', organizationId)
      .maybeSingle();
    if (orgError || !orgCheck) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const { data: currentMembership } = await adminClient
      .from('organization_memberships')
      .select('role')
      .eq('user_id', id)
      .maybeSingle();

    const role = currentMembership?.role || 'viewer';

    const { error: membershipError } = await adminClient.from('organization_memberships').upsert({
      organization_id: organizationId,
      user_id: id,
      role,
    });
    if (membershipError) {
      return NextResponse.json({ error: `Failed to update organization: ${membershipError.message}` }, { status: 500 });
    }

    const { error: auditError } = await adminClient.from('audit_logs').insert({
      actor_id: user.id,
      action: 'ORGANIZATION_ASSIGNED',
      resource_type: 'user',
      resource_id: id,
      target_user_id: id,
      organization_id: organizationId,
      detail: { organization_id: organizationId, role },
      metadata: { organization_id: organizationId, role },
    });
    if (auditError) {
      console.error('Audit log write failed:', auditError.message);
    }

    return NextResponse.json({ success: true, message: 'Organization updated.' });
  } catch (error: unknown) {
    console.error('Organization change error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}