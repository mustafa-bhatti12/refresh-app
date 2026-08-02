import { View, Text, Pressable, Alert, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { Notification01Icon } from "@hugeicons/core-free-icons";
import { useColors } from "@/constants/use-colors";
import type { ColorRamp } from "@/constants/colors";
import { useRefresh } from "@/context/RefreshContext";

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

export function AppHeader() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const s = styles(colors);
  const { currentUser } = useRefresh();
  const router = useRouter();

  return (
    <View style={[s.container, { paddingTop: insets.top + 8 }]}>
      <View style={s.brand}>
        <Image source={require("@/assets/images/logo.png")} style={s.logo} contentFit="contain" tintColor={colors.ink} />
        <Text style={s.title}>Refresh</Text>
      </View>
      <View style={s.actions}>
        <Pressable
          style={s.avatar}
          onPress={() => router.push(currentUser?.role === "Brewer" ? "/brewer-profile" : "/profile")}
          accessibilityRole="button"
          accessibilityLabel="Open profile"
          hitSlop={8}
        >
          <Text style={s.avatarText}>{currentUser ? initialsOf(currentUser.name) : "?"}</Text>
        </Pressable>
        {/* ponytail: notifications center not built yet, stub until in-app notifications ships */}
        <Pressable
          style={s.bellButton}
          onPress={() => Alert.alert("Notifications", "No new notifications yet.")}
          accessibilityRole="button"
          accessibilityLabel="Notifications"
          hitSlop={8}
        >
          <HugeiconsIcon icon={Notification01Icon} size={22} color={colors.ink} strokeWidth={1.5} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = (colors: ColorRamp) =>
  StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingBottom: 12,
      backgroundColor: colors.paper,
      borderBottomWidth: 1,
      borderBottomColor: colors.dividerZinc,
    },
    brand: { flexDirection: "row", alignItems: "center", gap: 8 },
    logo: { width: 28, height: 28 },
    title: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.ink,
      includeFontPadding: false,
      textAlignVertical: "center",
      lineHeight: 28,
    },
    actions: { flexDirection: "row", alignItems: "center", gap: 14 },
    avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.ink, alignItems: "center", justifyContent: "center" },
    avatarText: { color: colors.white, fontSize: 13, fontWeight: "700" },
    bellButton: { minWidth: 44, minHeight: 44, alignItems: "center", justifyContent: "center" },
  });
