export const PRIMARY_SUPER_ADMIN_EMAIL = 'ashokvallabhuni28@gmail.com';

export const SUPER_ADMIN_ROLE = 'SUPER_ADMIN';

export const SUPER_ADMIN_METADATA_ROLE = 'super_admin';

export const SUPER_ADMIN_METADATA = {
  role: SUPER_ADMIN_METADATA_ROLE,
  is_super_admin: true,
};

export const ALLOWED_REQUEST_ROLES = ['analyst', 'admin', 'researcher', 'viewer'] as const;

export function normalizeEmail(email: string | undefined | null): string | null {
  if (!email) return null;
  const trimmed = email.trim().toLowerCase();
  return trimmed || null;
}

export function isPrimarySuperAdmin(email: string | undefined | null): boolean {
  return normalizeEmail(email) === PRIMARY_SUPER_ADMIN_EMAIL;
}

export const PLATFORM_ORGANIZATION_SLUG = 'fortexa-platform';
