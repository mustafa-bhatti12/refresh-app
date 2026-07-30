import { useEffect, useState } from "react";
import { View, Text, ScrollView, Pressable, Alert, StyleSheet } from "react-native";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { CheckmarkCircle02Icon } from "@hugeicons/core-free-icons";
import { useColors } from "@/constants/use-colors";
import type { ColorRamp } from "@/constants/colors";
import { useRefresh, type Order } from "@/context/RefreshContext";
import { OrderForm } from "./order-form";
import { MyOrdersPanel } from "./my-orders";
import { BrewersBoard } from "./brewers-board";
import { OrderInfo } from "./order-info";
import { ReviewModal } from "./review-modal";

const COOLDOWN_MINS = 180;

export function OrderScreen() {
  const colors = useColors();
  const s = styles(colors);
  const {
    currentUser,
    orders,
    reviews,
    brewers,
    serviceHours,
    cooldownLimitEnabled,
    systemDate,
    placeOrder,
    cancelOrder,
    updateOrderDetails,
    submitReview,
    getDailyOrderNumber,
    logout,
  } = useRefresh();

  const [isAvailable, setIsAvailable] = useState(true);
  const [hasActiveOrder, setHasActiveOrder] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [isReordering, setIsReordering] = useState(false);
  const [cancelingOrderId, setCancelingOrderId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [reviewOrderId, setReviewOrderId] = useState<string | null>(null);

  const myOrders = currentUser
    ? orders
        .filter((o) => o.employeeId === currentUser.id && o.createdAt.startsWith(systemDate))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    : [];

  useEffect(() => {
    const check = () => {
      if (serviceHours.length === 0) {
        setIsAvailable(false);
        return;
      }
      const now = new Date();
      const currentDay = now.getDay();
      const currentTimeVal = now.getHours() * 60 + now.getMinutes();
      const matched = serviceHours.some((slot) => {
        if (!slot.days_of_week.includes(currentDay)) return false;
        const [startHrs, startMins] = slot.start_time.split(":").map(Number);
        const [endHrs, endMins] = slot.end_time.split(":").map(Number);
        const startTimeVal = startHrs * 60 + startMins;
        const endTimeVal = endHrs * 60 + endMins;
        return currentTimeVal >= startTimeVal && currentTimeVal <= endTimeVal;
      });
      setIsAvailable(matched);
    };
    check();
    const interval = setInterval(check, 15000);
    return () => clearInterval(interval);
  }, [serviceHours]);

  useEffect(() => {
    if (!currentUser) return;
    const myAllOrders = orders.filter((o) => o.employeeId === currentUser.id);
    const active = myAllOrders.some((o) => o.status === "Pending" || o.status === "In Progress" || o.status === "Ready");
    setHasActiveOrder(active);

    const lastOrder = [...myAllOrders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
    const calcCooldown = () => {
      if (!lastOrder || !cooldownLimitEnabled) {
        setCooldownRemaining(0);
        return;
      }
      const diffMins = (Date.now() - new Date(lastOrder.createdAt).getTime()) / (1000 * 60);
      setCooldownRemaining(diffMins < COOLDOWN_MINS ? Math.ceil(COOLDOWN_MINS - diffMins) : 0);
    };
    calcCooldown();
    const interval = setInterval(calcCooldown, 10000);
    return () => clearInterval(interval);
  }, [currentUser, orders, cooldownLimitEnabled]);

  const noBrewersActive = !brewers.some((b) => b.status === "Active");

  const isOrderBlocked = () =>
    !isAvailable || noBrewersActive || (currentUser?.role !== "Admin" && (hasActiveOrder || cooldownRemaining > 0));

  const pendingQueue = [...orders]
    .filter((o) => o.status === "Pending")
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  const queuePositionOf = (orderId: string) => {
    const idx = pendingQueue.findIndex((o) => o.id === orderId);
    return idx === -1 ? null : idx + 1;
  };

  const announce = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const handlePlaceOrder = async (floor: string, drink: string, sugar: string, strength: string, note: string) => {
    try {
      await placeOrder(floor, drink, sugar, strength, note);
      announce(`Order placed successfully for ${drink}!`);
    } catch (err) {
      Alert.alert("Order failed", err instanceof Error ? err.message : "Failed to place order.");
    }
  };

  const handleReorder = async (order: Order) => {
    if (isOrderBlocked()) return;
    setIsReordering(true);
    try {
      await placeOrder(order.floor, order.drink, order.sugar, order.strength || undefined, undefined);
      announce(`Order placed successfully for ${order.drink}!`);
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

  const reviewedOrderIds = new Set(reviews.map((r) => r.orderId));

  const unreviewedOrder = currentUser
    ? orders.find(
        (o) =>
          o.employeeId === currentUser.id &&
          o.status === "Delivered" &&
          o.feedbackComments !== "__NOT_FOUND__" &&
          (o.feedbackRating === undefined || o.feedbackRating === null)
      )
    : undefined;

  const activeReviewOrder = unreviewedOrder || (reviewOrderId ? orders.find((o) => o.id === reviewOrderId) : undefined);
  const isMandatoryReview = !!unreviewedOrder;

  const handleReviewSubmit = async (rating: number, comments: string) => {
    if (!activeReviewOrder) return;
    await submitReview(activeReviewOrder.id, rating, comments);
    setReviewOrderId(null);
    announce("Thank you for confirming delivery!");
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.paper }}>
      <ScrollView contentContainerStyle={s.scrollContent}>
        <View style={s.topRow}>
          <View style={s.headerRow}>
            <Text style={s.headline}>Place an Order</Text>
            <Text style={s.subheadline}>Choose your drink and preferences. We&apos;ll take care of the rest.</Text>
          </View>
          <Pressable onPress={() => logout()} style={s.logoutButton}>
            <Text style={s.logoutText}>Log Out</Text>
          </Pressable>
        </View>

        <View style={s.statRow}>
          <View style={s.statCard}>
            <Text style={s.statLabel}>Service Slots</Text>
            <Text style={s.statValue}>{isAvailable ? "Open" : "Closed"}</Text>
          </View>
          <View style={s.statCard}>
            <Text style={s.statLabel}>Work Day</Text>
            <Text style={s.statValue}>{systemDate}</Text>
          </View>
        </View>

        <OrderForm
          isAvailable={isAvailable}
          hasActiveOrder={hasActiveOrder}
          cooldownRemaining={cooldownRemaining}
          noBrewersActive={noBrewersActive}
          onSubmit={handlePlaceOrder}
        />

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

        <BrewersBoard brewers={brewers} />
        <OrderInfo />
      </ScrollView>

      {toast && (
        <View style={s.toast}>
          <HugeiconsIcon icon={CheckmarkCircle02Icon} size={18} color={colors.white} />
          <Text style={s.toastText}>{toast}</Text>
        </View>
      )}

      {activeReviewOrder && (
        <ReviewModal
          order={activeReviewOrder}
          dailyNumber={getDailyOrderNumber(activeReviewOrder.id, activeReviewOrder.createdAt)}
          mandatory={isMandatoryReview}
          onSubmit={handleReviewSubmit}
          onCancel={() => setReviewOrderId(null)}
        />
      )}
    </View>
  );
}

const styles = (colors: ColorRamp) =>
  StyleSheet.create({
    scrollContent: { padding: 16, gap: 16, paddingBottom: 40 },
    topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 12 },
    logoutButton: { borderWidth: 1, borderColor: colors.hairlineZinc, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: colors.white },
    logoutText: { fontSize: 12, fontWeight: "700", color: colors.slateZinc },
    headerRow: { gap: 4, flex: 1 },
    headline: { fontSize: 28, fontWeight: "800", letterSpacing: -0.4, color: colors.ink },
    subheadline: { fontSize: 14, color: colors.quietZinc },
    statRow: { flexDirection: "row", gap: 10 },
    statCard: { flex: 1, borderWidth: 1, borderColor: colors.dividerZinc, backgroundColor: colors.white, borderRadius: 8, padding: 12 },
    statLabel: { fontSize: 10, fontWeight: "700", letterSpacing: 0.6, textTransform: "uppercase", color: colors.softZinc },
    statValue: { fontSize: 14, fontWeight: "700", color: colors.ink, marginTop: 4 },
    toast: {
      position: "absolute",
      bottom: 24,
      left: 16,
      right: 16,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      backgroundColor: colors.ink,
      borderRadius: 8,
      padding: 14,
    },
    toastText: { color: colors.white, fontSize: 13, fontWeight: "600", flex: 1 },
  });
