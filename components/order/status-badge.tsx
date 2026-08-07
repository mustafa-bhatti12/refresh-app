import { View, Text, StyleSheet } from "react-native";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  Clock01Icon,
  DeliveryTruck01Icon,
  CheckmarkCircle02Icon,
  Alert02Icon,
  HourglassIcon,
} from "@hugeicons/core-free-icons";
import { useColors } from "@/constants/use-colors";
import type { ColorRamp } from "@/constants/colors";

type OrderStatus = "Pending" | "Ready" | "Delivered" | "Not Found" | "Stale";

export function StatusBadge({ status }: { status: OrderStatus }) {
  const colors = useColors();
  const s = styles(colors);
  switch (status) {
    case "Pending":
      return (
        <View style={[s.badge, s.pending]}>
          <HugeiconsIcon icon={Clock01Icon} size={13} color={colors.midZinc} />
          <Text style={[s.text, { color: colors.midZinc }]}>Pending</Text>
        </View>
      );
    case "Ready":
      return (
        <View style={[s.badge, s.ready]}>
          <HugeiconsIcon icon={DeliveryTruck01Icon} size={13} color={colors.white} />
          <Text style={[s.text, { color: colors.white }]}>Ready</Text>
        </View>
      );
    case "Delivered":
      return (
        <View style={[s.badge, s.delivered]}>
          <HugeiconsIcon icon={CheckmarkCircle02Icon} size={13} color={colors.white} />
          <Text style={[s.text, { color: colors.white }]}>Delivered</Text>
        </View>
      );
    case "Not Found":
      return (
        <View style={[s.badge, s.notFound]}>
          <HugeiconsIcon icon={Alert02Icon} size={13} color={colors.ink} />
          <Text style={[s.text, { color: colors.ink, fontWeight: "700" }]}>Not Found</Text>
        </View>
      );
    case "Stale":
      return (
        <View style={[s.badge, s.stale]}>
          <HugeiconsIcon icon={HourglassIcon} size={13} color={colors.midZinc} />
          <Text style={[s.text, { color: colors.midZinc, fontWeight: "700" }]}>Auto-Cancelled</Text>
        </View>
      );
  }
}

const styles = (colors: ColorRamp) =>
  StyleSheet.create({
    badge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      borderRadius: 9999,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderWidth: 1,
    },
    text: { fontSize: 11, fontWeight: "600" },
    pending: { backgroundColor: colors.surfaceZinc, borderColor: colors.dividerZinc },
    ready: { backgroundColor: colors.slateZinc, borderColor: colors.slateZinc },
    delivered: { backgroundColor: colors.ink, borderColor: colors.ink },
    notFound: { backgroundColor: colors.white, borderColor: colors.ink, borderWidth: 2 },
    stale: { backgroundColor: colors.white, borderColor: colors.dividerZinc, borderWidth: 2 },
  });
