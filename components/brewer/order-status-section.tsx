import { View, Text, StyleSheet } from "react-native";
import { useColors } from "@/constants/use-colors";
import type { ColorRamp } from "@/constants/colors";

export function OrderStatusSection({
  title,
  subtitle,
  count,
  emptyMessage,
  isEmpty,
  children,
}: {
  title: string;
  subtitle: string;
  count: number;
  emptyMessage: string;
  isEmpty: boolean;
  children: React.ReactNode;
}) {
  const colors = useColors();
  const s = styles(colors);

  return (
    <View style={s.section}>
      <View style={s.header}>
        <Text style={s.title}>{title}</Text>
        <View style={s.countPill}>
          <Text style={s.countText}>{count}</Text>
        </View>
      </View>
      <Text style={s.subtitle}>{subtitle}</Text>
      <View style={s.card}>
        {isEmpty ? <Text style={s.emptyText}>{emptyMessage}</Text> : children}
      </View>
    </View>
  );
}

const styles = (colors: ColorRamp) =>
  StyleSheet.create({
    section: { marginBottom: 8 },
    header: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 2 },
    title: { fontSize: 15, fontWeight: "700", color: colors.ink },
    countPill: { backgroundColor: colors.surfaceZinc, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
    countText: { fontSize: 11, fontWeight: "700", color: colors.midZinc },
    subtitle: { fontSize: 11, color: colors.softZinc, marginBottom: 10 },
    card: { borderRadius: 12, borderWidth: 1, borderColor: colors.dividerZinc, backgroundColor: colors.white, paddingHorizontal: 16 },
    emptyText: { fontSize: 12, color: colors.softZinc, paddingVertical: 20, textAlign: "center" },
  });
