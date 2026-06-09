// Add university domains here — no code deploy needed if managed via Supabase table later
export const ALLOWED_DOMAINS = [
  'hec.edu',
];

export function isAllowedEmail(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase() ?? '';
  return ALLOWED_DOMAINS.some((d) => domain === d || domain.endsWith(`.${d}`));
}
