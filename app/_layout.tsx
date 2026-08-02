import "react-native-url-polyfill/auto";
import { useEffect } from "react";
import { useRouter, useSegments, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View, StyleSheet, useColorScheme } from "react-native";
import { RefreshProvider, useRefresh } from "@/context/RefreshContext";
import { resolveRoute } from "@/lib/session-router";
import { Skeleton } from "@/components/skeleton";
import { useColors } from "@/constants/use-colors";
import type { ColorRamp } from "@/constants/colors";

function AuthLoadingSkeleton() {
  const colors = useColors();
  const s = styles(colors);
  return (
    <View style={s.container}>
      <View style={s.card}>
        <View style={{ alignItems: "center", gap: 12 }}>
          <Skeleton style={{ width: 56, height: 56, borderRadius: 9999 }} />
          <Skeleton style={{ width: 180, height: 22 }} />
          <Skeleton style={{ width: 220, height: 14 }} />
        </View>
        <View style={{ gap: 12, marginTop: 24 }}>
          <Skeleton style={{ width: "100%", height: 44, borderRadius: 8 }} />
          <Skeleton style={{ width: "100%", height: 44, borderRadius: 8 }} />
          <Skeleton style={{ width: "100%", height: 44, borderRadius: 8 }} />
        </View>
      </View>
    </View>
  );
}

const styles = (colors: ColorRamp) =>
  StyleSheet.create({
    container: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.paper, padding: 24 },
    card: { width: "100%", maxWidth: 380, backgroundColor: colors.white, borderRadius: 16, borderWidth: 1, borderColor: colors.dividerZinc, padding: 24 },
  });

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
    if (route === "home") {
      if (currentUser?.role === "Brewer") {
        if (current !== "home" && current !== "brewer-profile") router.replace("/home");
      } else if (current !== "(tabs)") {
        router.replace("/order");
      }
    }
  }, [loading, currentUser, needsRoleSelection, segments, router]);

  if (loading) {
    return <AuthLoadingSkeleton />;
  }

  return <>{children}</>;
}

export default function RootLayout() {
  const scheme = useColorScheme();
  return (
    <RefreshProvider>
      <AuthGate>
        <Stack screenOptions={{ headerShown: false }} />
      </AuthGate>
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />
    </RefreshProvider>
  );
}
