import { useState } from "react";
import { View, ScrollView, Alert, StyleSheet } from "react-native";
import { useColors } from "@/constants/use-colors";
import { useRefresh, type Order } from "@/context/RefreshContext";
import { CardSkeleton } from "@/components/card-skeleton";
import { writeSavedFloor } from "@/lib/saved-floor";
import { MyOrdersPanel } from "./my-orders";

export function MyOrdersScreen() {
  const colors = useColors();
  const { currentUser, orders, reviews, systemDate, updateOrderDetails, cancelOrder, placeOrder, setReviewOrderId, dataLoading } = useRefresh();

  const [isReordering, setIsReordering] = useState(false);
  const [cancelingOrderId, setCancelingOrderId] = useState<string | null>(null);

  const myOrders = currentUser
    ? orders
        .filter((o) => o.employeeId === currentUser.id && o.createdAt.startsWith(systemDate))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    : [];

  // Orders not yet confirmed (Pending or In Progress) across everyone, oldest first —
  // excludes Ready/Delivered so the count shrinks as orders ahead get made.
  const pendingQueue = [...orders]
    .filter((o) => (o.status === "Pending" || o.status === "In Progress") && o.createdAt.startsWith(systemDate))
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  const queuePositionOf = (orderId: string) => {
    const idx = pendingQueue.findIndex((o) => o.id === orderId);
    return idx === -1 ? null : idx + 1;
  };

  const reviewedOrderIds = new Set(reviews.map((r) => r.orderId));

  const handleReorder = async (order: Order) => {
    setIsReordering(true);
    try {
      await placeOrder(order.floor, order.drink, order.sugar, order.strength || undefined, undefined);
      void writeSavedFloor(order.floor);
    } catch (err) {
      Alert.alert("Order failed", err instanceof Error ? err.message : "Failed to place order.");
    } finally {
      setIsReordering(false);
    }
  };

  const handleCancel = async (order: Order) => {
    setCancelingOrderId(order.id);
    try {
      await cancelOrder(order.id);
    } finally {
      setCancelingOrderId(null);
    }
  };

  if (dataLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.paper }}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <CardSkeleton lines={4} />
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.paper }}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <MyOrdersPanel
          orders={myOrders}
          reviewedOrderIds={reviewedOrderIds}
          queuePositionOf={queuePositionOf}
          isReordering={isReordering}
          cancelingOrderId={cancelingOrderId}
          onReorder={handleReorder}
          onCancel={handleCancel}
          onSaveEdit={updateOrderDetails}
          onRateOrder={setReviewOrderId}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: { padding: 16, gap: 16, paddingBottom: 40 },
});
