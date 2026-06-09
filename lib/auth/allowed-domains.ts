/**
 * School email domains → org key mapping.
 * Add a new entry here once a school's domain is confirmed.
 * The org key must match a key in lib/orgs.ts ORG_LABEL.
 */
export const SCHOOL_DOMAINS: Record<string, string> = {
  'hec.edu': 'hec',
  // Coming soon — uncomment when domain confirmed:
  // 'student.sciencespo.fr': 'sciencespo',
  // 'lbs.ac.uk': 'lbs',
  // 'escp.eu': 'escp',
  // 'insead.edu': 'insead',
  // 'lse.ac.uk': 'lse',
  // 'ucl.ac.uk': 'ucl',
  // 'ic.ac.uk': 'imperial',
};

export const ALLOWED_DOMAINS = Object.keys(SCHOOL_DOMAINS);

/** Returns the org key for an email's domain, or null if not whitelisted. */
export function getOrgFromEmail(email: string): string | null {
  const domain = email.split('@')[1]?.toLowerCase() ?? '';
  for (const [d, org] of Object.entries(SCHOOL_DOMAINS)) {
    if (domain === d || domain.endsWith(`.${d}`)) return org;
  }
  return null;
}

/** Returns true if the email is from a whitelisted school domain. */
export function isAllowedEmail(email: string): boolean {
  return getOrgFromEmail(email) !== null;
}

/**
 * Returns true if the email looks like a school/university address
 * that we don't support yet — triggers the "request your school" flow.
 */
export function looksLikeStudentEmail(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase() ?? '';
  return (
    domain.endsWith('.edu') ||
    domain.endsWith('.ac.uk') ||
    domain.endsWith('sciencespo.fr') ||
    domain.endsWith('escp.eu') ||
    domain.includes('insead') ||
    domain.includes('university') ||
    domain.includes('hochschule')
  );
}
