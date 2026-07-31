import { View, Text, Pressable, ScrollView, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import { useColors } from "@/constants/use-colors";
import type { ColorRamp } from "@/constants/colors";
import { useRefresh } from "@/context/RefreshContext";

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

export function ProfileScreen({ standalone }: { standalone?: boolean } = {}) {
  const colors = useColors();
  const s = styles(colors);
  const router = useRouter();
  const { currentUser, logout } = useRefresh();

  if (!currentUser) return null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.paper }}>
      <ScrollView contentContainerStyle={s.scrollContent}>
        {standalone && (
          <Pressable onPress={() => router.back()} style={s.backLink}>
            <HugeiconsIcon icon={ArrowLeft01Icon} size={14} color={colors.quietZinc} />
            <Text style={s.backLinkText}>Back</Text>
          </Pressable>
        )}
        <View style={s.card}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{initialsOf(currentUser.name)}</Text>
          </View>
          <Text style={s.name}>{currentUser.name}</Text>
          <Text style={s.contact}>{currentUser.contact}</Text>
          <View style={s.rolePill}>
            <Text style={s.rolePillText}>{currentUser.role}</Text>
          </View>
          {currentUser.floor && (
            <View style={s.detailRow}>
              <Text style={s.detailLabel}>Floor</Text>
              <Text style={s.detailValue}>{currentUser.floor}</Text>
            </View>
          )}
        </View>

        <Pressable onPress={() => logout()} style={s.logoutButton}>
          <Text style={s.logoutText}>Log Out</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = (colors: ColorRamp) =>
  StyleSheet.create({
    scrollContent: { padding: 16, gap: 16, paddingBottom: 40 },
    backLink: { flexDirection: "row", alignItems: "center", gap: 6 },
    backLinkText: { fontSize: 12, fontWeight: "600", color: colors.quietZinc },
    card: { alignItems: "center", borderRadius: 12, borderWidth: 1, borderColor: colors.dividerZinc, backgroundColor: colors.white, padding: 24, gap: 6 },
    avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.ink, alignItems: "center", justifyContent: "center", marginBottom: 8 },
    avatarText: { color: colors.white, fontSize: 22, fontWeight: "700" },
    name: { fontSize: 18, fontWeight: "800", color: colors.ink },
    contact: { fontSize: 13, color: colors.quietZinc },
    rolePill: { backgroundColor: colors.surfaceZinc, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4, marginTop: 8 },
    rolePillText: { fontSize: 11, fontWeight: "700", color: colors.slateZinc, textTransform: "uppercase", letterSpacing: 0.4 },
    detailRow: { flexDirection: "row", justifyContent: "space-between", width: "100%", marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.dividerZinc },
    detailLabel: { fontSize: 13, color: colors.softZinc },
    detailValue: { fontSize: 13, fontWeight: "700", color: colors.ink },
    logoutButton: { borderWidth: 1, borderColor: colors.hairlineZinc, borderRadius: 10, paddingVertical: 14, alignItems: "center", backgroundColor: colors.white },
    logoutText: { fontSize: 14, fontWeight: "700", color: colors.slateZinc },
  });
