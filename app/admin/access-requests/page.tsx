import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { isPrimarySuperAdmin, normalizeEmail } from '@/utils/auth';
import { ensurePrimarySuperAdmin } from '@/utils/supabase/primary-super-admin';
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

  const result = await ensurePrimarySuperAdmin(user);
  if (!result.ok) {
    console.warn('Primary Super Admin provisioning failed (non-blocking):', result.error);
  }

  return <AccessRequestsDashboard />;
}
