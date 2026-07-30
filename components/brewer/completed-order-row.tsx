import { View, Text, StyleSheet } from "react-native";
import { useColors } from "@/constants/use-colors";
import type { ColorRamp } from "@/constants/colors";
import type { Order } from "@/context/RefreshContext";
import { StatusBadge } from "@/components/order/status-badge";

export function CompletedOrderRow({ order, dailyNumber }: { order: Order; dailyNumber: string }) {
  const colors = useColors();
  const s = styles(colors);

  return (
    <View style={s.row}>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={s.title}>
          <Text style={s.dailyNumber}>{dailyNumber}</Text> {order.drink} <Text style={s.meta}>· {order.floor}</Text>
        </Text>
        <Text style={s.meta}>{order.employeeName}</Text>
      </View>
      <StatusBadge status={order.status} />
    </View>
  );
}

const styles = (colors: ColorRamp) =>
  StyleSheet.create({
    row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.dividerZinc },
    title: { fontSize: 12, fontWeight: "600", color: colors.slateZinc },
    dailyNumber: { fontWeight: "800", color: colors.ink },
    meta: { fontSize: 11, color: colors.softZinc },
  });
