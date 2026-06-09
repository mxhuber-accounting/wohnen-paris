import { type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import createIntlMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

const handleI18n = createIntlMiddleware(routing);

export default async function proxy(request: NextRequest) {
  // Collect session cookies Supabase wants to refresh
  const newCookies: { name: string; value: string; options: Record<string, unknown> }[] = [];

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach((c) => {
            request.cookies.set(c.name, c.value);
            newCookies.push(c);
          });
        },
      },
    },
  );

  // Refresh session — keeps the user logged in across requests
  await supabase.auth.getUser();

  // Run next-intl locale routing
  const response = handleI18n(request);

  // Forward any refreshed auth cookies onto the response
  newCookies.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2]);
  });

  return response;
}

export const config = {
  matcher: ['/((?!_next|_vercel|.*\\..*).*)'],
};
