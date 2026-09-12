CREATE TABLE IF NOT EXISTS public.access_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  username TEXT,
  email TEXT NOT NULL,
  organization_id UUID REFERENCES public.organizations(id),
  requested_role public.app_role NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
  requested_by UUID,
  reviewed_by UUID REFERENCES public.profiles(id),
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_access_requests_status ON public.access_requests(status);
CREATE INDEX idx_access_requests_email ON public.access_requests(email);
CREATE INDEX idx_access_requests_org ON public.access_requests(organization_id);
CREATE INDEX idx_access_requests_created ON public.access_requests(created_at DESC);

GRANT SELECT, INSERT ON public.access_requests TO authenticated;
GRANT SELECT, INSERT ON public.access_requests TO anon;
GRANT ALL ON public.access_requests TO service_role;

ALTER TABLE public.access_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "access_requests_own_read" ON public.access_requests
  FOR SELECT TO authenticated
  USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()) OR requested_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "access_requests_anon_insert" ON public.access_requests
  FOR INSERT TO anon
  WITH CHECK (true);

CREATE POLICY "access_requests_auth_insert" ON public.access_requests
  FOR INSERT TO authenticated
  WITH CHECK (true);
