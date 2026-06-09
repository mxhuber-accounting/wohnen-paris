export const ALLOWED_DOMAINS: string[] = [];

// Empty = open to everyone. Add domains (e.g. 'hec.edu') to restrict.
export function isAllowedEmail(_email: string): boolean {
  if (ALLOWED_DOMAINS.length === 0) return true;
  const domain = _email.split('@')[1]?.toLowerCase() ?? '';
  return ALLOWED_DOMAINS.some((d) => domain === d || domain.endsWith(`.${d}`));
}
