import { View, Text, Image, Pressable, Alert, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { Notification01Icon } from "@hugeicons/core-free-icons";
import { lightColors } from "@/constants/colors";
import { useRefresh } from "@/context/RefreshContext";

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

export function AppHeader() {
  const insets = useSafeAreaInsets();
  const { currentUser } = useRefresh();
  const router = useRouter();

  return (
    <View style={[s.container, { paddingTop: insets.top + 8 }]}>
      <View style={s.brand}>
        <Image source={require("@/assets/images/logo.png")} style={s.logo} resizeMode="contain" />
        <Text style={s.title}>Refresh</Text>
      </View>
      <View style={s.actions}>
        <Pressable style={s.avatar} onPress={() => router.push(currentUser?.role === "Brewer" ? "/brewer-profile" : "/profile")}>
          <Text style={s.avatarText}>{currentUser ? initialsOf(currentUser.name) : "?"}</Text>
        </Pressable>
        {/* ponytail: notifications center not built yet, stub until in-app notifications ships */}
        <Pressable style={s.bellButton} onPress={() => Alert.alert("Notifications", "No new notifications yet.")}>
          <HugeiconsIcon icon={Notification01Icon} size={22} color={lightColors.ink} strokeWidth={1.5} />
        </Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: lightColors.paper,
    borderBottomWidth: 1,
    borderBottomColor: lightColors.dividerZinc,
  },
  brand: { flexDirection: "row", alignItems: "center", gap: 8 },
  logo: { width: 28, height: 28 },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: lightColors.ink,
    includeFontPadding: false,
    textAlignVertical: "center",
    lineHeight: 28,
  },
  actions: { flexDirection: "row", alignItems: "center", gap: 14 },
  avatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: lightColors.ink, alignItems: "center", justifyContent: "center" },
  avatarText: { color: lightColors.white, fontSize: 13, fontWeight: "700" },
  bellButton: { padding: 2 },
});
