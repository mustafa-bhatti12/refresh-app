import { View, Text, StyleSheet } from "react-native";
import { useColors } from "@/constants/use-colors";
import type { ColorRamp } from "@/constants/colors";
import { Counter } from "@/components/counter";

export function QueueSummary({
  ordersAhead,
  ready,
  estWaitMins,
}: {
  ordersAhead: number;
  ready: number;
  estWaitMins: number | null;
}) {
  const colors = useColors();
  const s = styles(colors);

  return (
    <View style={s.card}>
      <Text style={s.title}>Queue Overview</Text>
      <View style={s.row}>
        <StatCell label="Orders Ahead" value={ordersAhead} colors={colors} />
        <StatCell label="Ready" value={ready} colors={colors} />
      </View>
      {estWaitMins !== null && (
        <Text style={s.waitText}>Estimated wait: ~{estWaitMins} min</Text>
      )}
    </View>
  );
}

function StatCell({ label, value, colors }: { label: string; value: number; colors: ColorRamp }) {
  return (
    <View style={{ flex: 1 }}>
      <Counter value={value} fontSize={22} fontWeight="800" color={colors.ink} />
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
