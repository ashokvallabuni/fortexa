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

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isValidUUID(id)) {
    return NextResponse.json({ error: 'Invalid user id' }, { status: 400 });
  }

  try {
    const user = await authorize(req);
    if (!user) {
      return NextResponse.json({ error: 'Forbidden: Super Admin required' }, { status: 403 });
    }

    if (id === user.id) {
      return NextResponse.json({ error: 'Super Admin cannot disable themselves' }, { status: 400 });
    }

    const adminClient = createAdminClient();

    const { error: profileError } = await adminClient
      .from('profiles')
      .update({ status: 'DISABLED' })
      .eq('id', id);
    if (profileError) {
      return NextResponse.json({ error: `Failed to disable user: ${profileError.message}` }, { status: 500 });
    }

    await adminClient.auth.admin.updateUserById(id, { user_metadata: { disabled: true } });

    const { error: auditError } = await adminClient.from('audit_logs').insert({
      actor_id: user.id,
      action: 'USER_DISABLED',
      resource_type: 'user',
      resource_id: id,
      target_user_id: id,
      detail: {},
      metadata: {},
    });
    if (auditError) {
      console.error('Audit log write failed:', auditError.message);
    }

    return NextResponse.json({ success: true, message: 'User disabled.' });
  } catch (error: unknown) {
    console.error('Disable user error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}