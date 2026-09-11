import type { User } from '@supabase/supabase-js';

export async function requireAdmin(request: Request): Promise<
  | { user: User; supabaseAdmin: Awaited<typeof import('@/integrations/supabase/client.server')>['supabaseAdmin'] }
  | Response
> {
  const authorization = request.headers.get('authorization');
  const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : null;
  if (!token) return Response.json({ success: false, message: 'Authentication required.' }, { status: 401 });
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) return Response.json({ success: false, message: 'Invalid session.' }, { status: 401 });
  const access = await supabaseAdmin.rpc('can_access_admin', { _user_id: data.user.id, _permission_code: 'admin.console' });
  if (access.error || !access.data) return Response.json({ success: false, message: 'Administrator permission required.' }, { status: 403 });
  return { user: data.user, supabaseAdmin };
}

export async function requireAuthenticated(request: Request): Promise<
  | { user: User; supabaseAdmin: Awaited<typeof import('@/integrations/supabase/client.server')>['supabaseAdmin'] }
  | Response
> {
  const authorization = request.headers.get('authorization');
  const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : null;
  if (!token) return Response.json({ success: false, message: 'Authentication required.' }, { status: 401 });
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) return Response.json({ success: false, message: 'Invalid session.' }, { status: 401 });
  return { user: data.user, supabaseAdmin };
}