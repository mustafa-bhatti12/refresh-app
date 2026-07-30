import AsyncStorage from "@react-native-async-storage/async-storage";
import { CachedRefreshUser, encodeCache, decodeCache } from "./auth-cache-codec";

export type { CachedRefreshUser };

const KEY = "refresh_auth_cache_v1";

export async function readAuthCache(): Promise<CachedRefreshUser | null> {
  const raw = await AsyncStorage.getItem(KEY);
  return decodeCache(raw);
}

export async function writeAuthCache(
  user: Omit<CachedRefreshUser, "needsRoleSelection"> | null,
  needsRoleSelection = false
): Promise<void> {
  if (!user) {
    await AsyncStorage.removeItem(KEY);
    return;
  }
  await AsyncStorage.setItem(KEY, encodeCache(user, needsRoleSelection));
}

export async function clearAuthCache(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}
