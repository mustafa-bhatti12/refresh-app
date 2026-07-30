import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "refresh_saved_floor_v1";

export async function readSavedFloor(): Promise<string | null> {
  return AsyncStorage.getItem(KEY);
}

export async function writeSavedFloor(floor: string): Promise<void> {
  await AsyncStorage.setItem(KEY, floor);
}
