import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    // Build the redirect response first so we can attach auth cookies to it
    const response = NextResponse.redirect(`${origin}${next}`);

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          // Read from the incoming request headers
          getAll() {
            return (
              request.headers
                .get('cookie')
                ?.split(';')
                .map((c) => {
                  const [name, ...rest] = c.trim().split('=');
                  return { name: name.trim(), value: rest.join('=').trim() };
                }) ?? []
            );
          },
          // Write onto the outgoing response — the read-only request store can't persist sessions
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options),
            );
          },
        },
      },
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return response;
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
