import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { isPrimarySuperAdmin, normalizeEmail } from '@/utils/auth';
import AccessRequestsDashboard from './_dashboard';

export default async function AdminAccessRequestsPage() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/login?error=authentication_required');
  }

  const email = normalizeEmail(user.email);
  if (!isPrimarySuperAdmin(email)) {
    redirect('/workspace');
  }

  const { data: canAccess, error: adminError } = await supabase.rpc('can_access_admin', {
    _user_id: user.id,
    _permission_code: 'admin.console',
  });

  if (adminError || !canAccess) {
    redirect('/login?error=super_admin_required');
  }

  return <AccessRequestsDashboard />;
}
