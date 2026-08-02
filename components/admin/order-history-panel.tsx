import { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useColors } from "@/constants/use-colors";
import type { ColorRamp } from "@/constants/colors";
import type { Order } from "@/context/RefreshContext";
import { StatusBadge } from "@/components/order/status-badge";

const PAGE_SIZE = 15;

export function OrderHistoryPanel({ orders, getDailyOrderNumber }: { orders: Order[]; getDailyOrderNumber: (id: string, createdAt: string) => string }) {
  const colors = useColors();
  const s = styles(colors);
  const [page, setPage] = useState(1);

  const sorted = [...orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const clampedPage = Math.min(page, totalPages);
  const paged = sorted.slice((clampedPage - 1) * PAGE_SIZE, clampedPage * PAGE_SIZE);

  return (
    <View style={s.card}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text style={s.title}>Order Logs</Text>
        <Text style={s.count}>{sorted.length} orders</Text>
      </View>

      {sorted.length === 0 ? (
        <Text style={s.emptyText}>No orders recorded.</Text>
      ) : (
        <>
          {paged.map((order, idx) => (
            <View key={order.id} style={[s.row, idx === paged.length - 1 && { borderBottomWidth: 0 }]}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Text style={s.orderNumber}>{getDailyOrderNumber(order.id, order.createdAt)}</Text>
                  <StatusBadge status={order.status} />
                </View>
                <Text style={s.employeeName}>{order.employeeName}</Text>
                <Text style={s.meta}>{order.floor} · {order.drink} ({order.sugar})</Text>
              </View>
              <Text style={s.time}>{new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</Text>
            </View>
          ))}

          {sorted.length > PAGE_SIZE && (
            <View style={s.pager}>
              <Text style={s.pagerText}>Page {clampedPage} of {totalPages}</Text>
              <View style={{ flexDirection: "row", gap: 8 }}>
                <Pressable
                  disabled={clampedPage <= 1}
                  onPress={() => setPage(clampedPage - 1)}
                  style={[s.pagerButton, clampedPage <= 1 && s.pagerButtonDisabled]}
                  accessibilityRole="button"
                  accessibilityLabel="Previous page"
                  accessibilityState={{ disabled: clampedPage <= 1 }}
                >
                  <Text style={s.pagerButtonText}>Previous</Text>
                </Pressable>
                <Pressable
                  disabled={clampedPage >= totalPages}
                  onPress={() => setPage(clampedPage + 1)}
                  style={[s.pagerButton, clampedPage >= totalPages && s.pagerButtonDisabled]}
                  accessibilityRole="button"
                  accessibilityLabel="Next page"
                  accessibilityState={{ disabled: clampedPage >= totalPages }}
                >
                  <Text style={s.pagerButtonText}>Next</Text>
                </Pressable>
              </View>
            </View>
          )}
        </>
      )}
    </View>
  );
}

const styles = (colors: ColorRamp) =>
  StyleSheet.create({
    card: { borderRadius: 12, borderWidth: 1, borderColor: colors.dividerZinc, backgroundColor: colors.white, padding: 20 },
    title: { fontSize: 15, fontWeight: "700", color: colors.ink },
    count: { fontSize: 11, fontWeight: "600", color: colors.softZinc },
    emptyText: { fontSize: 12, color: colors.softZinc, textAlign: "center", paddingVertical: 24 },
    row: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.dividerZinc },
    orderNumber: { fontSize: 12, fontWeight: "800", color: colors.ink },
    employeeName: { fontSize: 12, fontWeight: "600", color: colors.slateZinc, marginTop: 3 },
    meta: { fontSize: 11, color: colors.softZinc, marginTop: 1 },
    time: { fontSize: 11, color: colors.softZinc },
    pager: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: colors.dividerZinc },
    pagerText: { fontSize: 11, fontWeight: "600", color: colors.softZinc },
    pagerButton: { minHeight: 44, justifyContent: "center", borderWidth: 1, borderColor: colors.hairlineZinc, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: colors.white },
    pagerButtonDisabled: { opacity: 0.4 },
    pagerButtonText: { fontSize: 11, fontWeight: "700", color: colors.slateZinc },
  });
