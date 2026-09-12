-- RLS policies for complete FORTEXA access control
-- Ensures users can only access their own data, admins can manage all

-- Profiles: users can read/update own profile, admins can read all
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_upsert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;

CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "profiles_upsert_own" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (auth.uid() = id OR public.has_role(auth.uid(), 'admin'::public.app_role));

-- User Roles: users can read own roles, admins can manage all
DROP POLICY IF EXISTS "user_roles_select_own" ON public.user_roles;

CREATE POLICY "user_roles_select_own" ON public.user_roles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "user_roles_admin_manage" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Organizations: members can read their org, admins can read all
DROP POLICY IF EXISTS "organization_membership_read" ON public.organizations;

CREATE POLICY "organization_membership_read" ON public.organizations
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_memberships m
      WHERE m.organization_id = id AND m.user_id = auth.uid()
    )
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
  );

CREATE POLICY "organizations_admin_manage" ON public.organizations
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Organization Memberships: users can read own memberships, admins can manage all
DROP POLICY IF EXISTS "own_membership_read" ON public.organization_memberships;

CREATE POLICY "own_membership_read" ON public.organization_memberships
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "memberships_admin_manage" ON public.organization_memberships
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Role Permissions: users with role can read permissions, admins can manage all
DROP POLICY IF EXISTS "permission_read" ON public.role_permissions;

CREATE POLICY "permission_read" ON public.role_permissions
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR EXISTS (
      SELECT 1
      FROM public.organization_memberships membership
      WHERE membership.user_id = auth.uid() AND membership.role = role_permissions.role
    )
  );

CREATE POLICY "permissions_admin_manage" ON public.role_permissions
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Access Requests: requester can read own, primary super admin can read all assigned to them
DROP POLICY IF EXISTS "access_requests_requester_read" ON public.access_requests;
DROP POLICY IF EXISTS "access_requests_primary_admin_read" ON public.access_requests;
DROP POLICY IF EXISTS "access_requests_self_update" ON public.access_requests;
DROP POLICY IF EXISTS "access_requests_anon_insert" ON public.access_requests;
DROP POLICY IF EXISTS "access_requests_auth_insert" ON public.access_requests;

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

CREATE POLICY "access_requests_anon_insert" ON public.access_requests
  FOR INSERT TO anon
  WITH CHECK (true);

CREATE POLICY "access_requests_auth_insert" ON public.access_requests
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "access_requests_self_update" ON public.access_requests
  FOR UPDATE TO authenticated
  USING (
    (lower(email) = lower((SELECT email FROM auth.users WHERE id = auth.uid())) OR requested_by = auth.uid())
    AND status = 'PENDING'
  )
  WITH CHECK (
    (lower(email) = lower((SELECT email FROM auth.users WHERE id = auth.uid())) OR requested_by = auth.uid())
    AND status = 'PENDING'
  );

CREATE POLICY "access_requests_admin_update" ON public.access_requests
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Audit Logs: only admins can read
DROP POLICY IF EXISTS "audit_admin_read" ON public.audit_logs;

CREATE POLICY "audit_admin_read" ON public.audit_logs
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Ensure RLS is enabled on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;