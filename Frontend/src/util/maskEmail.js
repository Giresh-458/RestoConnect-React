/**
 * Mask an email address for display.
 * "john.doe@example.com" → "j***@example.com"
 */
export function maskEmail(email) {
  if (!email || typeof email !== "string") return "—";
  const [local, domain] = email.split("@");
  if (!domain) return email;
  const masked = local.length > 1 ? local[0] + "***" : local + "***";
  return `${masked}@${domain}`;
}
