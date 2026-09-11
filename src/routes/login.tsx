import { createFileRoute, redirect } from '@tanstack/react-router';
import { LoginPage } from '@/pages/LoginPage';
import { supabase } from '@/integrations/supabase/client';

export const Route = createFileRoute('/login')({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session) throw redirect({ to: '/workspace' });
  },
  component: LoginPage,
});
