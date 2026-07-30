import { View, Text, StyleSheet } from "react-native";
import { useColors } from "@/constants/use-colors";
import type { ColorRamp } from "@/constants/colors";

export function BrewerStats({
  totalToday,
  completedToday,
  inProgressToday,
  avgOrderTimeLabel,
}: {
  totalToday: number;
  completedToday: number;
  inProgressToday: number;
  avgOrderTimeLabel: string | null;
}) {
  const colors = useColors();
  const s = styles(colors);

  return (
    <View style={s.card}>
      <Text style={s.title}>Today&apos;s Stats</Text>
      <View style={s.grid}>
        <Stat label="Total" value={String(totalToday)} colors={colors} />
        <Stat label="Completed" value={String(completedToday)} colors={colors} />
        <Stat label="In Progress" value={String(inProgressToday)} colors={colors} />
        <Stat label="Avg Time" value={avgOrderTimeLabel ?? "—"} colors={colors} />
      </View>
    </View>
  );
}

function Stat({ label, value, colors }: { label: string; value: string; colors: ColorRamp }) {
  return (
    <View style={{ width: "48%" }}>
      <Text style={{ fontSize: 18, fontWeight: "800", color: colors.ink }}>{value}</Text>
      <Text style={{ fontSize: 10, fontWeight: "600", color: colors.softZinc, marginTop: 2 }}>{label}</Text>
    </View>
  );
}

const styles = (colors: ColorRamp) =>
  StyleSheet.create({
    card: { borderRadius: 12, borderWidth: 1, borderColor: colors.dividerZinc, backgroundColor: colors.white, padding: 20 },
    title: { fontSize: 15, fontWeight: "700", color: colors.ink, marginBottom: 12 },
    grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  });
