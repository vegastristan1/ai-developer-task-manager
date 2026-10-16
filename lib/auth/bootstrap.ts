const DEFAULT_BOOTSTRAP_ADMIN_EMAILS = ['vegastristan1@gmail.com'];

function parseAdminListEnv(): string[] {
  const raw = process.env['ADMIN_EMAILS'];
  if (!raw) return [];
  return raw
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter((entry) => entry.length > 0);
}

export function getBootstrapAdminEmails(): string[] {
  const merged = [...DEFAULT_BOOTSTRAP_ADMIN_EMAILS, ...parseAdminListEnv()].map((email) =>
    email.toLowerCase(),
  );
  return [...new Set(merged)];
}

export function isBootstrapAdmin(email: string): boolean {
  return getBootstrapAdminEmails().includes(email.trim().toLowerCase());
}
