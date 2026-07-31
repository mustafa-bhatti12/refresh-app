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

export async function signOutGoogle(): Promise<void> {
  try {
    // Configure first — on app launch from a persisted session, signInWithGoogle()
    // (the only other caller of configure) never ran, so signOut() would otherwise
    // throw on an unconfigured module and silently leave the native session intact.
    configureGoogleSignIn();
    await GoogleSignin.signOut();
  } catch {
    // not signed in on the native side — nothing to clear
  }
}
