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
    return NextResponse.json({ error: 'Invalid request id' }, { status: 400 });
  }

  try {
    const user = await authorize(req);
    if (!user) {
      return NextResponse.json({ error: 'Forbidden: Super Admin required' }, { status: 403 });
    }

    let reason: string | null = null;
    const contentType = req.headers.get('content-type') ?? '';
    if (contentType.includes('application/json')) {
      const body = await req.json();
      reason = typeof body?.reason === 'string' ? body.reason : null;
    }

    const adminClient = createAdminClient();
    const { error: updateError } = await adminClient
      .from('access_requests')
      .update({
        status: 'REJECTED',
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        rejection_reason: reason || 'Access denied by administrator.',
      })
      .eq('id', id);

    if (updateError) {
      return NextResponse.json({ error: 'Failed to reject request' }, { status: 500 });
    }

    const { error: auditError } = await adminClient.from('audit_logs').insert({
      actor_id: user.id,
      action: 'REJECT_ACCESS_REQUEST',
      resource_type: 'access_request',
      resource_id: id,
      detail: { reason },
    });
    if (auditError) {
      console.error('Audit log write failed:', auditError.message);
    }

    return NextResponse.json({ success: true, message: 'Request rejected.' });
  } catch (error: unknown) {
    console.error('Rejection error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
