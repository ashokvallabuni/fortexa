import { createFileRoute, redirect } from '@tanstack/react-router';

type AuthCallbackSearch = {
  code?: string;
  error?: string;
  error_description?: string;
};

function loginRedirect(reason: string) {
  throw redirect({
    href: `/login?error=${encodeURIComponent(reason)}`,
  });
}

export const Route = createFileRoute('/auth/callback')({
  validateSearch: (search: Record<string, unknown>): AuthCallbackSearch => ({
    code: typeof search.code === 'string' ? search.code : undefined,
    error: typeof search.error === 'string' ? search.error : undefined,
    error_description:
      typeof search.error_description === 'string' ? search.error_description : undefined,
  }),
  beforeLoad: async ({ search }) => {
    if (search.error) {
      loginRedirect(search.error === 'access_denied' ? 'oauth_denied' : 'oauth_error');
    }

    if (!search.code) {
      loginRedirect('missing_code');
    }

    const { supabase } = await import('@/integrations/supabase/client');
    const { error } = await supabase.auth.exchangeCodeForSession(search.code);

    if (error) {
      loginRedirect('code_exchange_failed');
    }

    throw redirect({ to: '/workspace' });
  },
  component: () => null,
});
