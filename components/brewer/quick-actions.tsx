import { View, Text, Pressable, StyleSheet } from "react-native";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { PauseIcon, PlayIcon, Refresh01Icon } from "@hugeicons/core-free-icons";
import { useColors } from "@/constants/use-colors";
import type { ColorRamp } from "@/constants/colors";

export function QuickActions({
  isPaused,
  isTogglingPause,
  isRefreshing,
  onTogglePause,
  onRefresh,
}: {
  isPaused: boolean;
  isTogglingPause: boolean;
  isRefreshing: boolean;
  onTogglePause: () => void;
  onRefresh: () => void;
}) {
  const colors = useColors();
  const s = styles(colors);

  return (
    <View style={s.card}>
      <Text style={s.title}>Quick Actions</Text>
      <View style={{ gap: 8 }}>
        <Pressable disabled={isTogglingPause} onPress={onTogglePause} style={s.actionRow}>
          <HugeiconsIcon icon={isPaused ? PlayIcon : PauseIcon} size={16} color={colors.slateZinc} />
          <Text style={s.actionText}>{isTogglingPause ? "…" : isPaused ? "Resume Orders" : "Pause Orders"}</Text>
        </Pressable>
        <Pressable disabled={isRefreshing} onPress={onRefresh} style={s.actionRow}>
          <HugeiconsIcon icon={Refresh01Icon} size={16} color={colors.slateZinc} />
          <Text style={s.actionText}>{isRefreshing ? "Refreshing…" : "Refresh Queue"}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = (colors: ColorRamp) =>
  StyleSheet.create({
    card: { borderRadius: 12, borderWidth: 1, borderColor: colors.dividerZinc, backgroundColor: colors.white, padding: 20 },
    title: { fontSize: 15, fontWeight: "700", color: colors.ink, marginBottom: 12 },
    actionRow: { flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderColor: colors.hairlineZinc, borderRadius: 8, paddingVertical: 10, paddingHorizontal: 12, backgroundColor: colors.white },
    actionText: { fontSize: 12, fontWeight: "600", color: colors.slateZinc },
  });
