import { View, Text, StyleSheet } from "react-native";
import { useColors } from "@/constants/use-colors";
import type { ColorRamp } from "@/constants/colors";
import { Counter } from "@/components/counter";

export function BrewerStats({
  totalToday,
  completedToday,
  pendingToday,
  avgOrderTimeLabel,
}: {
  totalToday: number;
  completedToday: number;
  pendingToday: number;
  avgOrderTimeLabel: string | null;
}) {
  const colors = useColors();
  const s = styles(colors);

  return (
    <View style={s.card}>
      <Text style={s.title}>Today&apos;s Stats</Text>
      <View style={s.grid}>
        <Stat label="Total" value={totalToday} colors={colors} />
        <Stat label="Completed" value={completedToday} colors={colors} />
        <Stat label="Pending" value={pendingToday} colors={colors} />
        <View style={{ width: "48%" }}>
          <Text style={{ fontSize: 18, fontWeight: "800", color: colors.ink }}>{avgOrderTimeLabel ?? "—"}</Text>
          <Text style={{ fontSize: 11, fontWeight: "600", color: colors.softZinc, marginTop: 2 }}>Avg Time</Text>
        </View>
      </View>
    </View>
  );
}

function Stat({ label, value, colors }: { label: string; value: number; colors: ColorRamp }) {
  return (
    <View style={{ width: "48%" }}>
      <Counter value={value} fontSize={18} fontWeight="800" color={colors.ink} />
      <Text style={{ fontSize: 11, fontWeight: "600", color: colors.softZinc, marginTop: 2 }}>{label}</Text>
    </View>
  );
}

const styles = (colors: ColorRamp) =>
  StyleSheet.create({
    card: { borderRadius: 12, borderWidth: 1, borderColor: colors.dividerZinc, backgroundColor: colors.white, padding: 14 },
    title: { fontSize: 15, fontWeight: "700", color: colors.ink, marginBottom: 8 },
    grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  });
