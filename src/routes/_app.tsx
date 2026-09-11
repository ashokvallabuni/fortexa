import { createFileRoute } from '@tanstack/react-router';
import { AppShell } from '@/components/shell/AppShell';
import { redirect } from '@tanstack/react-router';
import { supabase } from '@/integrations/supabase/client';

export const Route = createFileRoute('/_app')({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: '/login' });
  },
  component: AppShell,
});
