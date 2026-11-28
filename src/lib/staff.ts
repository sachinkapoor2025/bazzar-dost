/** Server allowlist. Admin is never decided in the browser. */
const BUILT_IN_ADMIN_EMAILS = ["gungun.kalra@mydgv.com", "gungun.kalra@dgv.com", "bazaardost.info@gmail.com"];

export function staffAdminEmails(envValue = process.env.ADMIN_EMAILS): Set<string> {
  const configured = (envValue || "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
  return new Set([...BUILT_IN_ADMIN_EMAILS.map((email) => email.toLowerCase()), ...configured]);
}

export function roleForEmail(email: string, envValue = process.env.ADMIN_EMAILS): "admin" | "customer" {
  return staffAdminEmails(envValue).has(email.trim().toLowerCase()) ? "admin" : "customer";
}

export function isAdminRole(role: unknown): boolean {
  return role === "admin";
}

/** Allowlisted staff stay admins. A stored admin role is kept for every other account. */
export function effectiveRole(email: string, storedRole: unknown): "admin" | "customer" {
  if (roleForEmail(email) === "admin" || isAdminRole(storedRole)) return "admin";
  return "customer";
}
