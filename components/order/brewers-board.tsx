import { View, Text, StyleSheet } from "react-native";
import { useColors } from "@/constants/use-colors";
import type { ColorRamp } from "@/constants/colors";
import type { BrewerItem } from "@/context/RefreshContext";

export function BrewersBoard({ brewers }: { brewers: BrewerItem[] }) {
  const colors = useColors();
  const s = styles(colors);

  return (
    <View style={s.card}>
      <Text style={s.title}>Brewers Board</Text>
      <View style={{ gap: 2 }}>
        {brewers.map((bwr, idx) => {
          const badgeStyle =
            bwr.status === "Active" ? s.active : bwr.status === "On Break" ? s.onBreak : s.off;
          const badgeTextStyle =
            bwr.status === "Active" ? s.activeText : bwr.status === "On Break" ? s.onBreakText : s.offText;
          return (
            <View key={bwr.id} style={[s.row, idx === brewers.length - 1 && { borderBottomWidth: 0 }]}>
              <Text style={s.name}>{bwr.name}</Text>
              <View style={[s.badge, badgeStyle]}>
                <Text style={[s.badgeText, badgeTextStyle]}>{bwr.status}</Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = (colors: ColorRamp) =>
  StyleSheet.create({
    card: { borderRadius: 12, borderWidth: 1, borderColor: colors.dividerZinc, backgroundColor: colors.white, padding: 24 },
    title: { fontSize: 18, fontWeight: "700", color: colors.ink, marginBottom: 12 },
    row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.dividerZinc },
    name: { fontSize: 13, fontWeight: "600", color: colors.slateZinc },
    badge: { borderRadius: 9999, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1 },
    badgeText: { fontSize: 11, fontWeight: "600" },
    active: { backgroundColor: colors.ink, borderColor: colors.ink },
    activeText: { color: colors.white },
    onBreak: { backgroundColor: colors.dividerZinc, borderColor: colors.hairlineZinc },
    onBreakText: { color: colors.slateZinc },
    off: { backgroundColor: colors.white, borderColor: colors.dividerZinc },
    offText: { color: colors.quietZinc },
  });
