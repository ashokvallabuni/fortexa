-- Full FORTEXA access-request and user lifecycle schema extensions.

-- Canonical user lifecycle statuses.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'app_user_status'
  ) THEN
    CREATE TYPE public.app_user_status AS ENUM ('PENDING', 'ACTIVE', 'DISABLED', 'REJECTED');
  END IF;
END $$;

-- access_requests: add username, reviewer target, and CANCELLED status.
ALTER TABLE public.access_requests
  ADD COLUMN IF NOT EXISTS username TEXT;

ALTER TABLE public.access_requests
  DROP CONSTRAINT IF EXISTS access_requests_status_check;
ALTER TABLE public.access_requests
  ADD CONSTRAINT access_requests_status_check
  CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'));

-- Default reviewer target remains the primary Super Admin.
ALTER TABLE public.access_requests
  ALTER COLUMN reviewer_email DROP IF EXISTS;
ALTER TABLE public.access_requests
  ALTER COLUMN reviewer_email SET DEFAULT 'ashokvallabhuni28@gmail.com';

CREATE INDEX IF NOT EXISTS idx_access_requests_reviewer_status
  ON public.access_requests (reviewer_email, status);

-- profiles: lifecycle status + last login visibility for admin dashboards.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS status public.app_user_status NOT NULL DEFAULT 'PENDING';
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;

UPDATE public.profiles
SET status = 'ACTIVE'
WHERE status IS NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles (status);

-- Audit trail columns required by the access-request/user lifecycle events.
ALTER TABLE public.audit_logs
  ADD COLUMN IF NOT EXISTS target_user_id UUID,
  ADD COLUMN IF NOT EXISTS organization_id UUID,
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

UPDATE public.audit_logs
SET metadata = COALESCE(detail, '{}'::jsonb)
WHERE metadata IS NULL OR metadata = '{}'::jsonb;

-- Ensure audit metadata stays in sync with detail for new writes.
CREATE OR REPLACE FUNCTION public.normalize_audit_metadata()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
BEGIN
  IF NEW.metadata IS NULL OR NEW.metadata = '{}'::jsonb THEN
    NEW.metadata := COALESCE(NEW.detail, '{}'::jsonb);
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.normalize_audit_metadata() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.normalize_audit_metadata() TO authenticated, service_role;

DROP TRIGGER IF EXISTS audit_metadata_normalizer ON public.audit_logs;
CREATE TRIGGER audit_metadata_normalizer
  BEFORE INSERT OR UPDATE ON public.audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.normalize_audit_metadata();

-- RLS: only the requester, the primary Super Admin, or an admin can read access requests.
DROP POLICY IF EXISTS "access_requests_own_read" ON public.access_requests;
CREATE POLICY "access_requests_requester_read" ON public.access_requests
  FOR SELECT TO authenticated
  USING (
    lower(email) = lower((SELECT email FROM auth.users WHERE id = auth.uid()))
    OR requested_by = auth.uid()
  );

CREATE POLICY "access_requests_primary_admin_read" ON public.access_requests
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    AND lower((SELECT email FROM auth.users WHERE id = auth.uid())) = 'ashokvallabhuni28@gmail.com'
    AND lower(reviewer_email) = 'ashokvallabhuni28@gmail.com'
  );

-- RLS: only the requester can update their own request before it is processed.
DROP POLICY IF EXISTS "access_requests_auth_insert" ON public.access_requests;
CREATE POLICY "access_requests_self_update" ON public.access_requests
  FOR UPDATE TO authenticated
  USING (
    (email = (SELECT email FROM auth.users WHERE id = auth.uid()) OR requested_by = auth.uid())
    AND status = 'PENDING'
  )
  WITH CHECK (
    (email = (SELECT email FROM auth.users WHERE id = auth.uid()) OR requested_by = auth.uid())
    AND status = 'PENDING'
  );
