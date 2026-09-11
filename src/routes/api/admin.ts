import { createFileRoute } from '@tanstack/react-router';
import { requireAdmin } from '@/lib/core/admin-auth.server';

function requestContext(request: Request) {
  return {
    ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? request.headers.get('x-real-ip'),
    userAgent: request.headers.get('user-agent'),
  };
}

export const Route = createFileRoute('/api/admin')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const access = await requireAdmin(request);
        if (access instanceof Response) return access;
        const db = access.supabaseAdmin;

        const [profiles, roles, datasets, uploads, models, alerts, audit, assets] = await Promise.all([
          db.from('profiles').select('id,email,display_name,created_at').order('created_at', { ascending: false }).limit(100),
          db.from('user_roles').select('user_id,role,created_at'),
          db.from('datasets').select('id,name,source_format,flow_count,entity_count,state_count,processing_status,validation_status,created_at,owner_id').order('created_at', { ascending: false }).limit(50),
          db.from('uploads').select('id,filename,file_format,status,progress,size_bytes,created_at,updated_at').order('created_at', { ascending: false }).limit(25),
          db.from('model_versions').select('id,name,version,stage,metrics,notes,created_at').order('created_at', { ascending: false }).limit(50),
          db.from('alerts').select('id,title,severity,status,detected_at,entity_key').order('detected_at', { ascending: false }).limit(50),
          db.from('audit_logs').select('id,action,resource_type,resource_id,detail,created_at,actor_id,actor_email,ip_address,user_agent,success,before_values,after_values').order('created_at', { ascending: false }).limit(50),
          db.from('network_entities').select('id', { count: 'exact', head: true }),
        ]);
        const failed = [profiles, roles, datasets, uploads, models, alerts, audit, assets].find((result) => result.error);
        if (failed?.error) return Response.json({ success: false, message: failed.error.message }, { status: 500 });

        const roleByUser = new Map((roles.data ?? []).map((item) => [item.user_id, item.role]));
        return Response.json({
          success: true,
          data: {
            metrics: {
              organizations: new Set((datasets.data ?? []).map((item) => item.owner_id).filter(Boolean)).size,
              activeUsers: profiles.data?.length ?? 0,
              networkAssets: assets.count ?? 0,
              activeAlerts: (alerts.data ?? []).filter((item) => item.status !== 'resolved').length,
              highRiskForecasts: (alerts.data ?? []).filter((item) => item.severity === 'high' || item.severity === 'critical').length,
              ingestion: (uploads.data ?? []).some((item) => item.status !== 'COMPLETED') ? 'Processing' : 'Healthy',
            },
            profiles: (profiles.data ?? []).map((profile) => ({ ...profile, role: roleByUser.get(profile.id) ?? 'viewer' })),
            datasets: datasets.data ?? [],
            uploads: uploads.data ?? [],
            models: models.data ?? [],
            alerts: alerts.data ?? [],
            audit: audit.data ?? [],
            services: {
              backend: true,
              database: true,
              storage: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
              inference: Boolean(process.env.ML_INFERENCE_URL),
            },
          },
        });
      },
      POST: async ({ request }) => {
        const access = await requireAdmin(request);
        if (access instanceof Response) return access;
        const body = (await request.json()) as { action?: string; id?: string; status?: string; role?: 'admin' | 'SUPER_ADMIN' | 'analyst' | 'researcher' | 'viewer'; email?: string };
        const db = access.supabaseAdmin;
        let error: { message: string } | null = null;
        let beforeValues: Record<string, unknown> | null = null;
        let afterValues: Record<string, unknown> | null = null;
        const context = requestContext(request);

        if (body.action === 'alert.status' && body.id && body.status) {
          const current = await db.from('alerts').select('id,status,severity,title').eq('id', body.id).maybeSingle();
          beforeValues = current.data;
          ({ error } = await db.from('alerts').update({ status: body.status }).eq('id', body.id));
          afterValues = { id: body.id, status: body.status };
        } else if (body.action === 'user.role' && body.id && body.role) {
          const current = await db.from('user_roles').select('user_id,role').eq('user_id', body.id);
          beforeValues = { roles: current.data ?? [] };
          ({ error } = await db.from('user_roles').upsert({ user_id: body.id, role: body.role }, { onConflict: 'user_id,role' }));
          afterValues = { user_id: body.id, role: body.role };
        } else if (body.action === 'model.activate' && body.id) {
          const current = await db.from('model_versions').select('id,stage,name,version').eq('id', body.id).maybeSingle();
          beforeValues = current.data;
          ({ error } = await db.from('model_versions').update({ stage: 'production' }).eq('id', body.id));
          afterValues = { id: body.id, stage: 'production' };
        } else if (body.action === 'user.invite' && body.email) {
          const invited = await db.auth.admin.inviteUserByEmail(body.email);
          error = invited.error;
        } else {
          return Response.json({ success: false, message: 'Unsupported admin action.' }, { status: 400 });
        }

        await db.from('audit_logs').insert({
          actor_id: access.user.id,
          actor_email: access.user.email ?? null,
          action: body.action ?? 'admin.action',
          resource_id: body.id ?? null,
          resource_type: body.action?.split('.')[0] ?? 'system',
          detail: body,
          success: !error,
          before_values: beforeValues,
          after_values: afterValues,
          ip_address: context.ipAddress,
          user_agent: context.userAgent,
        });
        if (error) return Response.json({ success: false, message: error.message }, { status: 500 });
        return Response.json({ success: true });
      },
    },
  },
});