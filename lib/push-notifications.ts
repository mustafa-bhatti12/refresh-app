import { Platform } from "react-native";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";

// ponytail: one token per profile, overwritten on each app-open — add a
// push_tokens table if multiple simultaneous devices per user matter later.
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (!Device.isDevice) return null;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== "granted") return null;

  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  if (!projectId) return null;

  try {
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    return token;
  } catch (err) {
    console.error("Error getting Expo push token:", err);
    return null;
  }
}
