import { User } from '@supabase/supabase-js';
import { createAdminClient } from '@/utils/supabase/admin';
import {
  SUPER_ADMIN_ROLE,
  SUPER_ADMIN_METADATA,
  PRIMARY_SUPER_ADMIN_EMAIL,
  PLATFORM_ORGANIZATION_SLUG,
} from '@/utils/auth';

export async function ensurePrimarySuperAdmin(user: User): Promise<void> {
  const admin = createAdminClient();
  const metadata = user.user_metadata ?? {};
  const displayName =
    typeof metadata.full_name === 'string' && metadata.full_name
      ? metadata.full_name
      : typeof metadata.name === 'string' && metadata.name
      ? metadata.name
      : 'Ashok Vallabhuni';

  const { error: profileError } = await admin.from('profiles').upsert({
    id: user.id,
    email: PRIMARY_SUPER_ADMIN_EMAIL,
    display_name: displayName,
  });
  if (profileError) throw new Error(`profile: ${profileError.message}`);

  const { error: roleError } = await admin.from('user_roles').upsert({
    user_id: user.id,
    role: SUPER_ADMIN_ROLE,
  });
  if (roleError) throw new Error(`user_roles: ${roleError.message}`);

  const { data: platformOrg } = await admin
    .from('organizations')
    .select('id')
    .eq('slug', PLATFORM_ORGANIZATION_SLUG)
    .maybeSingle();

  if (platformOrg?.id) {
    const { error: membershipError } = await admin.from('organization_memberships').upsert({
      organization_id: platformOrg.id,
      user_id: user.id,
      role: SUPER_ADMIN_ROLE,
    });
    if (membershipError) throw new Error(`membership: ${membershipError.message}`);
  }

  const { error: metadataError } = await admin.auth.admin.updateUserById(user.id, {
    user_metadata: { ...(metadata ?? {}), ...SUPER_ADMIN_METADATA },
  });
  if (metadataError) throw new Error(`metadata: ${metadataError.message}`);

  const { data: verified, error: verifyError } = await admin
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .eq('role', SUPER_ADMIN_ROLE)
    .maybeSingle();

  if (verifyError || !verified) {
    throw new Error('super_admin role could not be verified');
  }
}
