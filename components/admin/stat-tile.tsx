import { View, Text, StyleSheet } from "react-native";
import { useColors } from "@/constants/use-colors";
import type { ColorRamp } from "@/constants/colors";

export function StatTile({ label, value, emphasis }: { label: string; value: string; emphasis?: "ink" | "outline" }) {
  const colors = useColors();
  const s = styles(colors);
  return (
    <View style={[s.tile, emphasis === "ink" && s.tileInk, emphasis === "outline" && s.tileOutline]}>
      <Text style={[s.label, emphasis === "ink" && s.labelInk]}>{label}</Text>
      <Text style={[s.value, emphasis === "ink" && s.valueInk]}>{value}</Text>
    </View>
  );
}

const styles = (colors: ColorRamp) =>
  StyleSheet.create({
    tile: { flexBasis: "31%", flexGrow: 1, borderRadius: 10, borderWidth: 1, borderColor: colors.dividerZinc, backgroundColor: colors.white, padding: 10 },
    tileInk: { backgroundColor: colors.ink, borderColor: colors.ink },
    tileOutline: { borderWidth: 2, borderColor: colors.ink },
    label: { fontSize: 10, fontWeight: "600", color: colors.softZinc },
    labelInk: { color: colors.dividerZinc },
    value: { fontSize: 18, fontWeight: "800", color: colors.ink, marginTop: 3 },
    valueInk: { color: colors.white },
  });
