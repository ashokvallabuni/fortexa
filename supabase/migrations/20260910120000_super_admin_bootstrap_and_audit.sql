-- Canonical platform administrator role and secure first-admin bootstrap.
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'SUPER_ADMIN';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'SECURITY_MANAGER';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'SOC_ANALYST';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'NETWORK_SECURITY_ADMIN';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'RESEARCHER';

ALTER TABLE public.audit_logs
  ADD COLUMN IF NOT EXISTS actor_email TEXT,
  ADD COLUMN IF NOT EXISTS ip_address INET,
  ADD COLUMN IF NOT EXISTS user_agent TEXT,
  ADD COLUMN IF NOT EXISTS success BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS before_values JSONB,
  ADD COLUMN IF NOT EXISTS after_values JSONB;

-- Existing RLS expressions call has_role(..., 'admin'). Make that check
-- include SUPER_ADMIN so all existing admin policies inherit the elevation.
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND (role = _role OR (role::text = 'SUPER_ADMIN' AND _role::text = 'admin'))
  )
$$;

REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO authenticated, service_role;

DROP POLICY IF EXISTS "audit_admin_read" ON public.audit_logs;
CREATE POLICY "audit_admin_read" ON public.audit_logs
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));