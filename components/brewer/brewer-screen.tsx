import { useEffect, useRef, useState } from "react";
import { View, Text, ScrollView, Pressable, Alert, StyleSheet } from "react-native";
import * as Haptics from "expo-haptics";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { PauseIcon, Notification01Icon } from "@hugeicons/core-free-icons";
import { useColors } from "@/constants/use-colors";
import type { ColorRamp } from "@/constants/colors";
import { useRefresh, type Order } from "@/context/RefreshContext";
import { OrderRow } from "./order-row";
import { CompletedOrderRow } from "./completed-order-row";
import { OrderStatusSection } from "./order-status-section";
import { QueueSummary } from "./queue-summary";
import { QuickActions } from "./quick-actions";
import { BrewerStats } from "./brewer-stats";

const NEXT_STATUS: Record<string, Order["status"] | undefined> = {
  Pending: "In Progress",
  "In Progress": "Ready",
  Ready: "Delivered",
};

const COMPLETED_DISPLAY_LIMIT = 8;

export function BrewerScreen() {
  const colors = useColors();
  const s = styles(colors);
  const {
    orders,
    currentUser,
    systemDate,
    updateOrderStatus,
    updateBrewerStatus,
    refreshOrders,
    logout,
    getDailyOrderNumber,
  } = useRefresh();

  const [actioningOrderId, setActioningOrderId] = useState<string | null>(null);
  const [pauseToggling, setPauseToggling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [newOrderAlert, setNewOrderAlert] = useState(false);
  const prevPendingCount = useRef<number | null>(null);

  const todaysOrders = orders.filter((o) => o.createdAt.startsWith(systemDate));
  const pendingOrders = todaysOrders.filter((o) => o.status === "Pending");
  const inProgressOrders = todaysOrders.filter((o) => o.status === "In Progress");
  const readyOrders = todaysOrders.filter((o) => o.status === "Ready");
  const completedOrders = todaysOrders
    .filter((o) => o.status === "Delivered" || o.status === "Not Found")
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const completedList = completedOrders.slice(0, COMPLETED_DISPLAY_LIMIT);
  const hiddenCompletedCount = completedOrders.length - completedList.length;

  const sortByOldest = (list: Order[]) => [...list].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  const pendingList = sortByOldest(pendingOrders);
  const inProgressList = sortByOldest(inProgressOrders);
  const readyList = sortByOldest(readyOrders);

  useEffect(() => {
    if (prevPendingCount.current === null) {
      prevPendingCount.current = pendingOrders.length;
      return;
    }
    if (pendingOrders.length > prevPendingCount.current) {
      setNewOrderAlert(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    prevPendingCount.current = pendingOrders.length;
  }, [pendingOrders.length]);

  if (!currentUser) return null;

  const isPaused = currentUser.status !== "Active";

  const handlePrimaryAction = async (order: Order) => {
    const next = NEXT_STATUS[order.status];
    if (!next) return;
    setActioningOrderId(order.id);
    try {
      await updateOrderStatus(order.id, next, order.status);
    } catch (err) {
      Alert.alert("Update failed", err instanceof Error ? err.message : "Failed to update order.");
    } finally {
      setActioningOrderId(null);
    }
  };

  const handleCancel = (order: Order) => {
    Alert.alert(
      "Mark as Not Found?",
      `${getDailyOrderNumber(order.id, order.createdAt)} · ${order.floor} · ${order.drink}`,
      [
        { text: "Keep it", style: "cancel" },
        {
          text: "Not Found",
          style: "destructive",
          onPress: async () => {
            setActioningOrderId(order.id);
            try {
              await updateOrderStatus(order.id, "Not Found", order.status);
            } catch (err) {
              Alert.alert("Update failed", err instanceof Error ? err.message : "Failed to cancel order.");
            } finally {
              setActioningOrderId(null);
            }
          },
        },
      ]
    );
  };

  const handleTogglePause = async () => {
    setPauseToggling(true);
    try {
      await updateBrewerStatus(currentUser.id, isPaused ? "Active" : "On Break");
    } finally {
      setPauseToggling(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshOrders();
    } finally {
      setIsRefreshing(false);
    }
  };

  const deliveredToday = todaysOrders.filter((o) => o.status === "Delivered");
  const avgOrderMs =
    deliveredToday.length > 0
      ? deliveredToday.reduce((sum, o) => sum + (new Date(o.updatedAt).getTime() - new Date(o.createdAt).getTime()), 0) / deliveredToday.length
      : null;
  const avgOrderMins = avgOrderMs !== null ? Math.max(0, Math.round(avgOrderMs / 60000)) : null;
  const avgOrderLabel = avgOrderMins !== null ? `${Math.floor(avgOrderMins / 60)}:${String(avgOrderMins % 60).padStart(2, "0")}` : null;

  const ordersAhead = pendingOrders.length + inProgressOrders.length;
  const estWaitMins = avgOrderMins !== null && ordersAhead > 0 ? avgOrderMins * ordersAhead : null;

  const renderRows = (list: Order[]) =>
    list.map((order, idx) => (
      <View key={order.id} style={idx === list.length - 1 ? { borderBottomWidth: 0 } : undefined}>
        <OrderRow
          order={order}
          dailyNumber={getDailyOrderNumber(order.id, order.createdAt)}
          isActioning={actioningOrderId === order.id}
          onPrimaryAction={() => handlePrimaryAction(order)}
          onCancel={() => handleCancel(order)}
        />
      </View>
    ));

  return (
    <View style={{ flex: 1, backgroundColor: colors.paper }}>
      <ScrollView contentContainerStyle={s.scrollContent}>
        <View style={s.topRow}>
          <Text style={s.headline}>Order Queue</Text>
          <Pressable onPress={() => logout()} style={s.logoutButton}>
            <Text style={s.logoutText}>Log Out</Text>
          </Pressable>
        </View>

        {isPaused && (
          <View style={s.pauseBanner}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}>
              <HugeiconsIcon icon={PauseIcon} size={16} color={colors.slateZinc} />
              <Text style={s.pauseBannerText}>Orders Paused — employees can&apos;t order right now.</Text>
            </View>
            <Pressable disabled={pauseToggling} onPress={handleTogglePause} style={s.resumeButton}>
              <Text style={s.resumeButtonText}>{pauseToggling ? "…" : "Resume"}</Text>
            </Pressable>
          </View>
        )}

        {newOrderAlert && (
          <View style={s.newOrderBanner}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}>
              <HugeiconsIcon icon={Notification01Icon} size={16} color={colors.white} />
              <Text style={s.newOrderText}>New order received</Text>
            </View>
            <Pressable onPress={() => setNewOrderAlert(false)}>
              <Text style={s.dismissText}>Dismiss</Text>
            </Pressable>
          </View>
        )}

        <QueueSummary ordersAhead={ordersAhead} inPreparation={inProgressOrders.length} ready={readyOrders.length} estWaitMins={estWaitMins} />

        <OrderStatusSection title="New Orders" subtitle="Waiting to be confirmed and started." count={pendingList.length} emptyMessage="No new orders right now." isEmpty={pendingList.length === 0}>
          {renderRows(pendingList)}
        </OrderStatusSection>

        <OrderStatusSection title="In Progress" subtitle="Orders currently being prepared." count={inProgressList.length} emptyMessage="Nothing being prepared right now." isEmpty={inProgressList.length === 0}>
          {renderRows(inProgressList)}
        </OrderStatusSection>

        <OrderStatusSection title="Ready" subtitle="Prepared and waiting for delivery." count={readyList.length} emptyMessage="No beverages ready yet." isEmpty={readyList.length === 0}>
          {renderRows(readyList)}
        </OrderStatusSection>

        <OrderStatusSection title="Completed" subtitle="Recently completed orders today." count={completedOrders.length} emptyMessage="Nothing completed yet today." isEmpty={completedList.length === 0}>
          {completedList.map((order, idx) => (
            <View key={order.id} style={idx === completedList.length - 1 ? { borderBottomWidth: 0 } : undefined}>
              <CompletedOrderRow order={order} dailyNumber={getDailyOrderNumber(order.id, order.createdAt)} />
            </View>
          ))}
          {hiddenCompletedCount > 0 && <Text style={s.hiddenCount}>+ {hiddenCompletedCount} more completed today</Text>}
        </OrderStatusSection>

        <QuickActions isPaused={isPaused} isTogglingPause={pauseToggling} isRefreshing={isRefreshing} onTogglePause={handleTogglePause} onRefresh={handleRefresh} />
        <BrewerStats totalToday={todaysOrders.length} completedToday={completedOrders.length} inProgressToday={inProgressOrders.length} avgOrderTimeLabel={avgOrderLabel} />
      </ScrollView>
    </View>
  );
}

const styles = (colors: ColorRamp) =>
  StyleSheet.create({
    scrollContent: { padding: 16, gap: 16, paddingBottom: 40 },
    topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    headline: { fontSize: 22, fontWeight: "800", letterSpacing: -0.3, color: colors.ink },
    logoutButton: { borderWidth: 1, borderColor: colors.hairlineZinc, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: colors.white },
    logoutText: { fontSize: 12, fontWeight: "700", color: colors.slateZinc },
    pauseBanner: { flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1, borderColor: colors.dividerZinc, backgroundColor: colors.surfaceZinc, borderRadius: 10, padding: 12 },
    pauseBannerText: { fontSize: 12, fontWeight: "600", color: colors.slateZinc, flex: 1 },
    resumeButton: { backgroundColor: colors.ink, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
    resumeButtonText: { color: colors.white, fontSize: 11, fontWeight: "700" },
    newOrderBanner: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: colors.ink, borderRadius: 10, padding: 12 },
    newOrderText: { fontSize: 12, fontWeight: "700", color: colors.white, flex: 1 },
    dismissText: { fontSize: 11, fontWeight: "700", color: colors.white, opacity: 0.8 },
    hiddenCount: { fontSize: 11, fontWeight: "600", color: colors.softZinc, paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.dividerZinc },
  });
