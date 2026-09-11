import { createFileRoute, redirect } from '@tanstack/react-router';
import { LoginPage } from '@/pages/LoginPage';
import { supabase } from '@/integrations/supabase/client';

export const Route = createFileRoute('/login')({
  beforeLoad: async () => {
    try {
      const { data } = await supabase.auth.getSession();
      if (data.session) throw redirect({ to: '/workspace' });
    } catch (error) {
      if (error && typeof error === 'object' && 'isRedirect' in error) throw error;
      // Supabase is unconfigured or unreachable: still render the sign-in page
      // instead of failing the whole request with a 500.
    }
  },
  component: LoginPage,
});
