import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { getOrgFromEmail } from '@/lib/auth/allowed-domains';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/feed';

  if (code) {
    const response = NextResponse.redirect(`${origin}${next}`);

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
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
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options),
            );
          },
        },
      },
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const { data: { user } } = await supabase.auth.getUser();

      if (user?.email) {
        const org = getOrgFromEmail(user.email);

        if (org) {
          // Verified student — stamp org + user_type on their profile
          await supabase
            .from('profiles')
            .update({ organization: org, user_type: 'student' })
            .eq('id', user.id);
        } else {
          // Not a whitelisted school domain — check for approved landlord
          const { data: approved } = await supabase
            .from('access_requests')
            .select('id')
            .eq('email', user.email.toLowerCase())
            .eq('status', 'approved')
            .maybeSingle();

          if (!approved) {
            // Neither student nor approved — revoke session
            await supabase.auth.signOut();
            return NextResponse.redirect(`${origin}/login?error=not_approved`);
          }

          // Approved landlord
          await supabase
            .from('profiles')
            .update({ user_type: 'landlord' })
            .eq('id', user.id);
        }
      }

      return response;
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
