import { useEffect, useState } from "react";
import { View, Text, Pressable, Alert, StyleSheet, FlatList } from "react-native";
import Animated, { FadeInDown, FadeOutRight, LinearTransition } from "react-native-reanimated";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  InboxIcon,
  RepeatIcon,
  Location01Icon,
  Queue01Icon,
  Clock01Icon,
  PencilEdit01Icon,
  CancelCircleIcon,
  CheckmarkCircle02Icon,
} from "@hugeicons/core-free-icons";
import { useColors } from "@/constants/use-colors";
import type { ColorRamp } from "@/constants/colors";
import type { Order } from "@/context/RefreshContext";
import { Counter } from "@/components/counter";
import { StatusBadge } from "./status-badge";
import { EditOrderForm } from "./edit-order-form";

function EditGraceTrigger({ order, onEditClick }: { order: Order; onEditClick: () => void }) {
  const colors = useColors();
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (order.status !== "Pending") {
      setTimeLeft(0);
      return;
    }
    const checkTime = () => {
      const elapsed = Date.now() - new Date(order.createdAt).getTime();
      setTimeLeft(Math.max(0, Math.ceil((30000 - elapsed) / 1000)));
    };
    checkTime();
    const interval = setInterval(checkTime, 1000);
    return () => clearInterval(interval);
  }, [order.createdAt, order.status]);

  if (timeLeft <= 0) return null;

  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: colors.surfaceZinc, borderWidth: 1, borderColor: colors.dividerZinc, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }}>
        <HugeiconsIcon icon={Clock01Icon} size={12} color={colors.midZinc} />
        <Text style={{ fontSize: 11, fontWeight: "700", color: colors.midZinc }}>Edit window: {timeLeft}s</Text>
      </View>
      <Pressable
        onPress={onEditClick}
        style={{ flexDirection: "row", alignItems: "center", gap: 3, borderWidth: 1, borderColor: colors.hairlineZinc, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2, backgroundColor: colors.white }}
        accessibilityRole="button"
        accessibilityLabel="Edit order"
        hitSlop={12}
      >
        <Text style={{ fontSize: 11, fontWeight: "700", color: colors.ink }}>Edit Order</Text>
        <HugeiconsIcon icon={PencilEdit01Icon} size={12} color={colors.ink} />
      </Pressable>
    </View>
  );
}

export function MyOrdersPanel({
  orders,
  reviewedOrderIds,
  queuePositionOf,
  isReordering,
  cancelingOrderId,
  onReorder,
  onCancel,
  onSaveEdit,
  onRateOrder,
}: {
  orders: Order[];
  reviewedOrderIds: Set<string>;
  queuePositionOf: (id: string) => number | null;
  isReordering: boolean;
  cancelingOrderId: string | null;
  onReorder: (order: Order) => void;
  onCancel: (order: Order) => void;
  onSaveEdit: (id: string, drink: string, sugar: string, floor: string) => Promise<void>;
  onRateOrder: (id: string) => void;
}) {
  const colors = useColors();
  const s = styles(colors);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const lastOrder = orders[0];

  const handleCancel = (order: Order) => {
    Alert.alert("Cancel order?", `Cancel your ${order.drink} order?`, [
      { text: "Keep it", style: "cancel" },
      { text: "Cancel order", style: "destructive", onPress: () => onCancel(order) },
    ]);
  };

  const renderHeader = () => (
    <View style={s.headerBlock}>
      <View style={s.headerRow}>
        <Text style={s.title}>My Recent Orders</Text>
        <View style={s.countPill}>
          <Counter value={orders.length} fontSize={11} fontWeight="600" color={colors.midZinc} />
          <Text style={s.countText}> total</Text>
        </View>
      </View>

      {lastOrder && (
        <Pressable
          disabled={isReordering}
          onPress={() => onReorder(lastOrder)}
          style={s.reorderRow}
          accessibilityRole="button"
          accessibilityLabel={isReordering ? "Placing order" : `Reorder ${lastOrder.drink} for ${lastOrder.floor}`}
          accessibilityState={{ disabled: isReordering, busy: isReordering }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flex: 1 }}>
            <HugeiconsIcon icon={RepeatIcon} size={14} color={colors.slateZinc} />
            <Text style={s.reorderText} numberOfLines={1}>
              {isReordering ? "Placing order…" : `Reorder ${lastOrder.drink} · ${lastOrder.floor}`}
            </Text>
          </View>
          <Text style={s.quickOrderLabel}>Quick Order</Text>
        </Pressable>
      )}
    </View>
  );

  return (
    <FlatList
      style={s.list}
      contentContainerStyle={orders.length === 0 ? s.listContentEmpty : s.listContent}
      data={orders}
      keyExtractor={(order) => order.id}
      ListHeaderComponent={renderHeader}
      ItemSeparatorComponent={() => <View style={s.separator} />}
      ListEmptyComponent={
        <View style={s.empty}>
          <HugeiconsIcon icon={InboxIcon} size={36} color={colors.softZinc} />
          <Text style={s.emptyTitle}>No orders placed yet.</Text>
          <Text style={s.emptySubtitle}>Use the form above to order.</Text>
        </View>
      }
      renderItem={({ item: order }) => {
        const hasReview = reviewedOrderIds.has(order.id);
        const isEditing = editingOrderId === order.id;
        const queuePosition =
          order.status === "Pending" || order.status === "In Progress" ? queuePositionOf(order.id) : null;

        return (
          <Animated.View entering={FadeInDown.duration(280)} exiting={FadeOutRight.duration(220)} layout={LinearTransition.duration(220)} style={s.orderRow}>
            {isEditing ? (
              <EditOrderForm
                order={order}
                onCancel={() => setEditingOrderId(null)}
                onSave={async (drink, sugar, floor) => {
                  await onSaveEdit(order.id, drink, sugar, floor);
                  setEditingOrderId(null);
                }}
              />
            ) : (
              <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={s.orderDrink}>
                    {order.drink} <Text style={s.orderSugar}>({order.sugar})</Text>
                  </Text>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 3 }}>
                    <HugeiconsIcon icon={Location01Icon} size={12} color={colors.quietZinc} />
                    <Text style={s.metaText}>{order.floor}</Text>
                  </View>
                  <Text style={s.metaTextSmall}>
                    Ordered at {new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </Text>
                  {order.brewerName && <Text style={s.metaTextSmall}>Prepared by {order.brewerName}</Text>}
                  {queuePosition && (
                    <View style={s.queuePill}>
                      <HugeiconsIcon icon={Queue01Icon} size={11} color={colors.midZinc} />
                      <Text style={s.queuePillText}>#</Text>
                      <Counter value={queuePosition} fontSize={11} fontWeight="700" color={colors.midZinc} />
                      <Text style={s.queuePillText}> in queue</Text>
                    </View>
                  )}
                  <EditGraceTrigger order={order} onEditClick={() => setEditingOrderId(order.id)} />
                  {order.status === "Pending" && (
                    <Pressable
                      disabled={cancelingOrderId === order.id}
                      onPress={() => handleCancel(order)}
                      style={s.cancelLinkRow}
                      accessibilityRole="button"
                      accessibilityLabel={cancelingOrderId === order.id ? "Cancelling order" : "Cancel order"}
                      accessibilityState={{ disabled: cancelingOrderId === order.id, busy: cancelingOrderId === order.id }}
                      hitSlop={10}
                    >
                      <HugeiconsIcon icon={CancelCircleIcon} size={12} color={colors.quietZinc} />
                      <Text style={s.cancelLink}>{cancelingOrderId === order.id ? "Cancelling…" : "Cancel Order"}</Text>
                    </Pressable>
                  )}
                </View>
                <View style={{ alignItems: "flex-end", gap: 8 }}>
                  <StatusBadge status={order.status} />
                  {order.status === "Delivered" && order.feedbackComments !== "__NOT_FOUND__" && (
                    hasReview ? (
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                        <HugeiconsIcon icon={CheckmarkCircle02Icon} size={13} color={colors.quietZinc} />
                        <Text style={s.reviewedText}>Reviewed</Text>
                      </View>
                    ) : (
                      <Pressable
                        onPress={() => onRateOrder(order.id)}
                        accessibilityRole="button"
                        accessibilityLabel="Rate beverage"
                        hitSlop={10}
                      >
                        <Text style={s.rateLink}>Rate Beverage</Text>
                      </Pressable>
                    )
                  )}
                </View>
              </View>
            )}
          </Animated.View>
        );
      }}
    />
  );
}

const styles = (colors: ColorRamp) =>
  StyleSheet.create({
    list: { flex: 1, borderRadius: 12, borderWidth: 1, borderColor: colors.dividerZinc, backgroundColor: colors.white },
    listContent: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 12 },
    listContentEmpty: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 4 },
    headerBlock: { marginBottom: 4 },
    headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
    title: { fontSize: 18, fontWeight: "700", color: colors.ink },
    countPill: { flexDirection: "row", alignItems: "center", backgroundColor: colors.surfaceZinc, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
    countText: { fontSize: 11, fontWeight: "600", color: colors.midZinc },
    reorderRow: { minHeight: 44, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8, borderRadius: 8, borderWidth: 1, borderColor: colors.dividerZinc, backgroundColor: colors.surfaceZinc, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 12 },
    reorderText: { fontSize: 12, fontWeight: "600", color: colors.slateZinc, flexShrink: 1 },
    quickOrderLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 0.6, textTransform: "uppercase", color: colors.softZinc },
    empty: { alignItems: "center", paddingVertical: 32 },
    emptyTitle: { fontSize: 13, fontWeight: "600", color: colors.quietZinc, marginTop: 10 },
    emptySubtitle: { fontSize: 11, color: colors.softZinc, marginTop: 3 },
    separator: { height: 1, backgroundColor: colors.dividerZinc },
    orderRow: { paddingVertical: 14 },
    orderDrink: { fontSize: 14, fontWeight: "700", color: colors.ink },
    orderSugar: { fontSize: 12, fontWeight: "400", color: colors.quietZinc },
    metaText: { fontSize: 11, color: colors.quietZinc },
    metaTextSmall: { fontSize: 11, color: colors.softZinc, marginTop: 2 },
    queuePill: { flexDirection: "row", alignItems: "center", gap: 3, alignSelf: "flex-start", backgroundColor: colors.surfaceZinc, borderWidth: 1, borderColor: colors.dividerZinc, borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2, marginTop: 6 },
    queuePillText: { fontSize: 11, fontWeight: "700", color: colors.midZinc },
    cancelLinkRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 6, alignSelf: "flex-start" },
    cancelLink: { fontSize: 11, fontWeight: "700", color: colors.quietZinc },
    reviewedText: { fontSize: 11, fontWeight: "600", color: colors.quietZinc },
    rateLink: { fontSize: 11, fontWeight: "700", color: colors.slateZinc, textDecorationLine: "underline" },
  });
