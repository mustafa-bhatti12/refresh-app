import "react-native-url-polyfill/auto";
import { useEffect } from "react";
import { useRouter, useSegments, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View, ActivityIndicator } from "react-native";
import { RefreshProvider, useRefresh } from "@/context/RefreshContext";
import { resolveRoute } from "@/lib/session-router";

function AuthGate({ children }: { children: React.ReactNode }) {
  const { currentUser, loading, needsRoleSelection } = useRefresh();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    const route = resolveRoute({ loading, currentUser, needsRoleSelection });
    const current = segments[0];
    if (route === "loading") return;
    if (route === "sign-in" && current !== "sign-in") router.replace("/sign-in");
    if (route === "onboarding" && current !== "onboarding") router.replace("/onboarding");
    if (route === "home" && current !== "home") router.replace("/home");
  }, [loading, currentUser, needsRoleSelection, segments, router]);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <RefreshProvider>
      <AuthGate>
        <Stack screenOptions={{ headerShown: false }} />
      </AuthGate>
      <StatusBar style="auto" />
    </RefreshProvider>
  );
}
