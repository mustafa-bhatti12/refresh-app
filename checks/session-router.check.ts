import { resolveRoute } from "../lib/session-router";

function assertEqual(actual: unknown, expected: unknown, label: string) {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${expected}, got ${actual}`);
  }
  console.log(`ok: ${label}`);
}

assertEqual(
  resolveRoute({ loading: true, currentUser: null, needsRoleSelection: false }),
  "loading",
  "loading takes priority over everything else"
);

assertEqual(
  resolveRoute({ loading: false, currentUser: null, needsRoleSelection: false }),
  "sign-in",
  "no user, not loading -> sign-in"
);

assertEqual(
  resolveRoute({
    loading: false,
    currentUser: { role: "Employee" },
    needsRoleSelection: true,
  }),
  "onboarding",
  "signed in but needs role selection -> onboarding"
);

assertEqual(
  resolveRoute({
    loading: false,
    currentUser: { role: "Brewer" },
    needsRoleSelection: false,
  }),
  "home",
  "fully onboarded -> home"
);

console.log("session-router.check.ts: all assertions passed");
