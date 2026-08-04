import { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import Animated, { ZoomIn } from "react-native-reanimated";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { ArrowDown01Icon, ArrowUp01Icon } from "@hugeicons/core-free-icons";
import { useColors } from "@/constants/use-colors";
import type { ColorRamp } from "@/constants/colors";

export function OrderStatusSection({
  title,
  subtitle,
  count,
  emptyMessage,
  isEmpty,
  children,
  collapsible,
}: {
  title: string;
  subtitle: string;
  count: number;
  emptyMessage: string;
  isEmpty: boolean;
  children: React.ReactNode;
  collapsible?: boolean;
}) {
  const colors = useColors();
  const s = styles(colors);
  const [collapsed, setCollapsed] = useState(!!collapsible);

  return (
    <View style={s.section}>
      <Pressable
        style={s.header}
        onPress={collapsible ? () => setCollapsed((c) => !c) : undefined}
        disabled={!collapsible}
        accessibilityRole={collapsible ? "button" : undefined}
        accessibilityLabel={collapsible ? `${title}, ${count} orders` : undefined}
        accessibilityState={collapsible ? { expanded: !collapsed } : undefined}
      >
        <Text style={s.title}>{title}</Text>
        {/* Remount-on-change is the whole trick: a fresh key gives Reanimated a
            fresh mount to play `entering` on, no shared-value wiring needed. */}
        <Animated.View key={count} entering={ZoomIn.duration(220)} style={s.countPill}>
          <Text style={s.countText}>{count}</Text>
        </Animated.View>
        {collapsible && (
          <HugeiconsIcon icon={collapsed ? ArrowDown01Icon : ArrowUp01Icon} size={16} color={colors.softZinc} />
        )}
      </Pressable>
      <Text style={s.subtitle}>{subtitle}</Text>
      {!(collapsible && collapsed) && (
        <View style={s.card}>{isEmpty ? <Text style={s.emptyText}>{emptyMessage}</Text> : children}</View>
      )}
    </View>
  );
}

const styles = (colors: ColorRamp) =>
  StyleSheet.create({
    section: { marginBottom: 0 },
    header: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 2, alignSelf: "flex-start" },
    title: { fontSize: 15, fontWeight: "700", color: colors.ink },
    countPill: { backgroundColor: colors.surfaceZinc, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
    countText: { fontSize: 11, fontWeight: "700", color: colors.midZinc },
    subtitle: { fontSize: 11, color: colors.softZinc, marginBottom: 6 },
    card: { borderRadius: 12, borderWidth: 1, borderColor: colors.dividerZinc, backgroundColor: colors.white, paddingHorizontal: 14 },
    emptyText: { fontSize: 12, color: colors.softZinc, paddingVertical: 12, textAlign: "center" },
  });
