import { NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: isAdmin, error: adminError } = await supabase.rpc('can_access_admin', { _user_id: user.id, _permission_code: 'admin.console' });
    
    if (adminError || !isAdmin) {
      return NextResponse.json({ error: 'Forbidden: Super Admin required' }, { status: 403 });
    }

    const body = await request.json();
    const { reason } = body;

    const adminClient = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { error: updateError } = await adminClient.from('access_requests').update({
      status: 'REJECTED',
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      rejection_reason: reason || 'Access denied by administrator.'
    }).eq('id', id);

    if (updateError) {
      return NextResponse.json({ error: 'Failed to reject request' }, { status: 500 });
    }

    await adminClient.from('audit_logs').insert({
      actor_id: user.id,
      action: 'REJECT_ACCESS_REQUEST',
      resource_type: 'access_request',
      resource_id: id,
      detail: { reason }
    });

    return NextResponse.json({ success: true, message: 'Request rejected.' });
  } catch (error: any) {
    console.error('Rejection error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
