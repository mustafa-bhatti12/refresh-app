export type CachedRefreshUser = {
  id: string;
  name: string;
  role: "Employee" | "Brewer" | "Admin";
  contact: string;
  floor?: string;
  status?: "Active" | "On Break" | "Off";
  avatar_url?: string;
  needsRoleSelection?: boolean;
};

export function encodeCache(
  user: Omit<CachedRefreshUser, "needsRoleSelection">,
  needsRoleSelection = false
): string {
  return JSON.stringify({ ...user, needsRoleSelection } satisfies CachedRefreshUser);
}

export function decodeCache(raw: string | null): CachedRefreshUser | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CachedRefreshUser;
  } catch {
    return null;
  }
}
