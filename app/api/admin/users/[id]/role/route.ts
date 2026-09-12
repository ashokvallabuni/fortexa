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

    let body: { role?: string };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const role = body.role;
    const validRoles = ['SOC_ANALYST', 'NETWORK_SECURITY_ADMIN', 'RESEARCHER', 'viewer', 'admin', 'SUPER_ADMIN', 'SECURITY_MANAGER'];
    if (!role || !validRoles.includes(role)) {
      return NextResponse.json({ error: 'Valid role is required' }, { status: 400 });
    }

    const adminClient = createAdminClient();

    const { error: roleError } = await adminClient.from('user_roles').upsert({
      user_id: id,
      role,
    });
    if (roleError) {
      return NextResponse.json({ error: `Failed to update role: ${roleError.message}` }, { status: 500 });
    }

    const { error: auditError } = await adminClient.from('audit_logs').insert({
      actor_id: user.id,
      action: 'ROLE_CHANGED',
      resource_type: 'user',
      resource_id: id,
      target_user_id: id,
      detail: { role },
      metadata: { role },
    });
    if (auditError) {
      console.error('Audit log write failed:', auditError.message);
    }

    return NextResponse.json({ success: true, message: 'Role updated.' });
  } catch (error: unknown) {
    console.error('Role change error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}