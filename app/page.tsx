import { redirect, notFound } from 'next/navigation';

// Supabase redirects auth errors (expired OTP, access denied) to the site
// root with ?error_code=... query params — forward them to the login page.
export default async function RootPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const params = await searchParams;
  if (params.error_code || params.error) {
    const code = params.error_code ?? params.error ?? 'auth';
    redirect(`/login?error=${code}`);
  }
  notFound();
}
