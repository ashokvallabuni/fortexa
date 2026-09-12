-- Primary Super Admin exclusive review routing for access requests.
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'SUPER_ADMIN';

ALTER TABLE public.access_requests
  ADD COLUMN IF NOT EXISTS reviewer_email TEXT;

UPDATE public.access_requests
SET reviewer_email = 'ashokvallabhuni28@gmail.com'
WHERE reviewer_email IS NULL;

ALTER TABLE public.access_requests
  ALTER COLUMN reviewer_email SET DEFAULT 'ashokvallabhuni28@gmail.com';

ALTER TABLE public.access_requests
  ALTER COLUMN reviewer_email SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_access_requests_reviewer_status
  ON public.access_requests (reviewer_email, status);

DROP POLICY IF EXISTS "access_requests_own_read" ON public.access_requests;
CREATE POLICY "access_requests_own_read" ON public.access_requests
  FOR SELECT TO authenticated
  USING (
    lower(email) = lower((SELECT email FROM auth.users WHERE id = auth.uid()))
    OR requested_by = auth.uid()
    OR (
      public.has_role(auth.uid(), 'admin'::public.app_role)
      AND lower((SELECT email FROM auth.users WHERE id = auth.uid())) = 'ashokvallabhuni28@gmail.com'
      AND lower(reviewer_email) = 'ashokvallabhuni28@gmail.com'
    )
  );

CREATE OR REPLACE FUNCTION public.assign_access_request_reviewer()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' OR NEW.status = 'PENDING' THEN
    NEW.reviewer_email := 'ashokvallabhuni28@gmail.com';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.assign_access_request_reviewer() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.assign_access_request_reviewer() TO authenticated, anon, service_role;

DROP TRIGGER IF EXISTS set_access_request_reviewer ON public.access_requests;
CREATE TRIGGER set_access_request_reviewer
  BEFORE INSERT OR UPDATE OF status, reviewer_email ON public.access_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_access_request_reviewer();
