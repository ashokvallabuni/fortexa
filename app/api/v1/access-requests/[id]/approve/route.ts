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
    const { organization_id, role } = body;

    if (!organization_id || !role) {
      return NextResponse.json({ error: 'organization_id and role are required' }, { status: 400 });
    }

    const adminClient = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data: requestData, error: requestError } = await adminClient
      .from('access_requests')
      .select('*')
      .eq('id', id)
      .single();

    if (requestError || !requestData || requestData.status !== 'PENDING') {
      return NextResponse.json({ error: 'Invalid or already processed request' }, { status: 400 });
    }

    const { data: newUser, error: createUserError } = await adminClient.auth.admin.inviteUserByEmail(
      requestData.email,
      { data: { full_name: requestData.full_name } }
    );

    if (createUserError && !createUserError.message.includes('already registered')) {
      return NextResponse.json({ error: `Failed to invite user: ${createUserError.message}` }, { status: 500 });
    }

    let targetUserId = newUser?.user?.id;
    
    if (!targetUserId) {
      const { data: existingUsers, error: listUserError } = await adminClient.auth.admin.listUsers();
      if (listUserError) {
        return NextResponse.json({ error: 'Failed to list users' }, { status: 500 });
      }
      const existingUser = existingUsers.users.find(u => u.email === requestData.email);
      if (!existingUser) {
        return NextResponse.json({ error: 'User creation failed and user not found' }, { status: 500 });
      }
      targetUserId = existingUser.id;
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
      role: role,
    });

    if (roleError) {
      return NextResponse.json({ error: `Failed to assign role: ${roleError.message}` }, { status: 500 });
    }

    const { error: orgError } = await adminClient.from('organization_memberships').upsert({
      organization_id: organization_id,
      user_id: targetUserId,
      role: role,
    });

    if (orgError) {
      return NextResponse.json({ error: `Failed to assign organization: ${orgError.message}` }, { status: 500 });
    }

    await adminClient.from('access_requests').update({
      status: 'APPROVED',
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      organization_id: organization_id,
      requested_role: role
    }).eq('id', id);

    await adminClient.from('audit_logs').insert({
      actor_id: user.id,
      action: 'APPROVE_ACCESS_REQUEST',
      resource_type: 'user',
      resource_id: targetUserId,
      detail: { email: requestData.email, role, organization_id }
    });

    return NextResponse.json({ success: true, message: 'User approved and invited.' });
  } catch (error: any) {
    console.error('Approval error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
