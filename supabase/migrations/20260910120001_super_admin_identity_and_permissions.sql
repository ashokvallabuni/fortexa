-- Organization and permission chain for privileged server authorization.
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.organization_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, user_id)
);
CREATE TABLE IF NOT EXISTS public.role_permissions (
  role public.app_role NOT NULL,
  permission_code TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (role, permission_code)
);

GRANT SELECT ON public.organizations, public.organization_memberships, public.role_permissions TO authenticated;
GRANT ALL ON public.organizations, public.organization_memberships, public.role_permissions TO service_role;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "organization_membership_read" ON public.organizations FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.organization_memberships m WHERE m.organization_id = id AND m.user_id = auth.uid()));
CREATE POLICY "own_membership_read" ON public.organization_memberships FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "permission_read" ON public.role_permissions FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1
      FROM public.organization_memberships membership
      WHERE membership.user_id = auth.uid() AND membership.role = role_permissions.role
    )
  );

INSERT INTO public.organizations (name, slug)
VALUES ('FORTEXA Platform', 'fortexa-platform')
ON CONFLICT (slug) DO NOTHING;
INSERT INTO public.role_permissions (role, permission_code)
VALUES
  ('admin', 'admin.console'),
  ('SUPER_ADMIN', 'admin.console'),
  ('SECURITY_MANAGER', 'security.workspace'),
  ('SOC_ANALYST', 'soc.workspace'),
  ('NETWORK_SECURITY_ADMIN', 'network.workspace'),
  ('RESEARCHER', 'research.workspace')
ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION public.can_access_admin(_user_id UUID, _permission_code TEXT)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_memberships membership
    JOIN public.role_permissions permission ON permission.role = membership.role
    WHERE membership.user_id = _user_id
      AND permission.permission_code = _permission_code
  )
$$;
REVOKE ALL ON FUNCTION public.can_access_admin(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_access_admin(UUID, TEXT) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.bootstrap_fortexa_super_admin()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE platform_org UUID;
BEGIN
  IF lower(COALESCE(NEW.email, '')) = 'ashokvallabhuni28@gmail.com' THEN
    INSERT INTO public.profiles (id, email, display_name)
    VALUES (NEW.id, lower(NEW.email), 'Ashok Vallabhuni')
    ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, display_name = EXCLUDED.display_name;
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'SUPER_ADMIN') ON CONFLICT (user_id, role) DO NOTHING;
    SELECT id INTO platform_org FROM public.organizations WHERE slug = 'fortexa-platform';
    INSERT INTO public.organization_memberships (organization_id, user_id, role)
    VALUES (platform_org, NEW.id, 'SUPER_ADMIN') ON CONFLICT (organization_id, user_id) DO UPDATE SET role = EXCLUDED.role;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.bootstrap_fortexa_super_admin() FROM PUBLIC;
DROP TRIGGER IF EXISTS on_fortexa_auth_user_bootstrap ON auth.users;
CREATE TRIGGER on_fortexa_auth_user_bootstrap AFTER INSERT OR UPDATE OF email ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.bootstrap_fortexa_super_admin();

INSERT INTO public.profiles (id, email, display_name)
SELECT id, lower(email), 'Ashok Vallabhuni' FROM auth.users
WHERE lower(email) = 'ashokvallabhuni28@gmail.com'
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, display_name = EXCLUDED.display_name;
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'SUPER_ADMIN' FROM auth.users WHERE lower(email) = 'ashokvallabhuni28@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;
INSERT INTO public.organization_memberships (organization_id, user_id, role)
SELECT organizations.id, auth.users.id, 'SUPER_ADMIN'
FROM public.organizations CROSS JOIN auth.users
WHERE organizations.slug = 'fortexa-platform' AND lower(auth.users.email) = 'ashokvallabhuni28@gmail.com'
ON CONFLICT (organization_id, user_id) DO UPDATE SET role = EXCLUDED.role;