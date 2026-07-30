export type SessionRole = "Employee" | "Brewer" | "Admin";

export interface SessionState {
  loading: boolean;
  currentUser: { role: SessionRole } | null;
  needsRoleSelection: boolean;
}

export type Route = "loading" | "sign-in" | "onboarding" | "home";

export function resolveRoute(state: SessionState): Route {
  if (state.loading) return "loading";
  if (!state.currentUser) return "sign-in";
  if (state.needsRoleSelection) return "onboarding";
  return "home";
}
