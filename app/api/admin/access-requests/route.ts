import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import {
  PRIMARY_SUPER_ADMIN_EMAIL,
  SUPER_ADMIN_ROLE,
  isPrimarySuperAdmin,
  normalizeEmail,
} from '@/utils/auth';

export const dynamic = 'force-dynamic';

async function authorizePrimaryAdmin() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user || !isPrimarySuperAdmin(user.email)) {
    return { user: null, error: NextResponse.json({ error: 'Forbidden: Super Admin required' }, { status: 403 }) };
  }

  return { user, error: null };
}

export async function GET() {
  try {
    const { user, error } = await authorizePrimaryAdmin();
    if (error || !user) return error as NextResponse;

    const adminClient = createAdminClient();
    const { data: requests, error: requestError } = await adminClient
      .from('access_requests')
      .select('*')
      .eq('status', 'PENDING')
      .eq('reviewer_email', PRIMARY_SUPER_ADMIN_EMAIL)
      .order('created_at', { ascending: false });

    if (requestError) {
      return NextResponse.json({ error: 'Failed to load pending requests' }, { status: 500 });
    }

    const { data: organizations, error: organizationError } = await adminClient
      .from('organizations')
      .select('id, name');

    if (organizationError) {
      return NextResponse.json({ error: 'Failed to load organizations' }, { status: 500 });
    }

    return NextResponse.json(
      { requests: requests ?? [], organizations: organizations ?? [] },
      { headers: { 'cache-control': 'no-store' } },
    );
  } catch (error: unknown) {
    console.error('Admin access-requests list error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
