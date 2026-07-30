import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { supabase } from "./supabase";

let configured = false;

export function configureGoogleSignIn() {
  if (configured) return;
  GoogleSignin.configure({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  });
  configured = true;
}

export async function signInWithGoogle(): Promise<void> {
  configureGoogleSignIn();
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  const response = await GoogleSignin.signIn();
  const idToken = response.data?.idToken;
  if (!idToken) {
    throw new Error("Google Sign-In did not return an ID token.");
  }
  const { error } = await supabase.auth.signInWithIdToken({
    provider: "google",
    token: idToken,
  });
  if (error) {
    throw new Error(error.message);
  }
}
