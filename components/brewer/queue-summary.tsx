import { View, Text, StyleSheet } from "react-native";
import { useColors } from "@/constants/use-colors";
import type { ColorRamp } from "@/constants/colors";

export function QueueSummary({
  ordersAhead,
  inPreparation,
  ready,
  estWaitMins,
}: {
  ordersAhead: number;
  inPreparation: number;
  ready: number;
  estWaitMins: number | null;
}) {
  const colors = useColors();
  const s = styles(colors);

  return (
    <View style={s.card}>
      <Text style={s.title}>Queue Overview</Text>
      <View style={s.row}>
        <StatCell label="Orders Ahead" value={String(ordersAhead)} colors={colors} />
        <StatCell label="Preparing" value={String(inPreparation)} colors={colors} />
        <StatCell label="Ready" value={String(ready)} colors={colors} />
      </View>
      {estWaitMins !== null && (
        <Text style={s.waitText}>Estimated wait: ~{estWaitMins} min</Text>
      )}
    </View>
  );
}

function StatCell({ label, value, colors }: { label: string; value: string; colors: ColorRamp }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={{ fontSize: 22, fontWeight: "800", color: colors.ink }}>{value}</Text>
      <Text style={{ fontSize: 11, fontWeight: "600", color: colors.softZinc, marginTop: 2 }}>{label}</Text>
    </View>
  );
}

const styles = (colors: ColorRamp) =>
  StyleSheet.create({
    card: { borderRadius: 12, borderWidth: 1, borderColor: colors.dividerZinc, backgroundColor: colors.white, padding: 14 },
    title: { fontSize: 15, fontWeight: "700", color: colors.ink, marginBottom: 8 },
    row: { flexDirection: "row", gap: 8 },
    waitText: { fontSize: 11, color: colors.quietZinc, marginTop: 8 },
  });
