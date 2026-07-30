import { encodeCache, decodeCache, CachedRefreshUser } from "../lib/auth-cache-codec";

function assertDeepEqual(actual: unknown, expected: unknown, label: string) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) {
    throw new Error(`${label}: expected ${e}, got ${a}`);
  }
  console.log(`ok: ${label}`);
}

const user: Omit<CachedRefreshUser, "needsRoleSelection"> = {
  id: "user-1",
  name: "Ghulam",
  role: "Employee",
  contact: "ghulam@hof-global.com",
  floor: "4th Floor",
  status: "Active",
  avatar_url: "",
};

const encoded = encodeCache(user, true);
const decoded = decodeCache(encoded);
assertDeepEqual(decoded, { ...user, needsRoleSelection: true }, "round-trips a full user");

assertDeepEqual(decodeCache(null), null, "decodes null as null");
assertDeepEqual(decodeCache("not json"), null, "decodes garbage as null instead of throwing");

console.log("auth-cache-codec.check.ts: all assertions passed");
