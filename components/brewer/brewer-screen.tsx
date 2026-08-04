import { useEffect, useRef, useState } from "react";
import { View, Text, ScrollView, Pressable, Alert, Modal, StyleSheet, FlatList, type LayoutChangeEvent, type NativeSyntheticEvent, type NativeScrollEvent } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { PauseIcon, Notification01Icon, PlayIcon, CheckmarkCircle02Icon, ListViewIcon, User03Icon, Cancel01Icon } from "@hugeicons/core-free-icons";
import { useColors } from "@/constants/use-colors";
import type { ColorRamp } from "@/constants/colors";
import { useRefresh, type Order } from "@/context/RefreshContext";
import { useBrewerStats } from "@/hooks/use-brewer-stats";
import { CardSkeleton } from "@/components/card-skeleton";
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

const NAV_ITEMS = [
  { key: "inProgress" as const, label: "In Progress", icon: PlayIcon },
  { key: "ready" as const, label: "Ready", icon: CheckmarkCircle02Icon },
  { key: "completed" as const, label: "Completed", icon: ListViewIcon },
];

export function BrewerScreen({ embedded }: { embedded?: boolean } = {}) {
  const colors = useColors();
  const s = styles(colors);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    orders,
    currentUser,
    systemDate,
    updateOrderStatus,
    updateBrewerStatus,
    refreshOrders,
    getDailyOrderNumber,
    dataLoading,
  } = useRefresh();

  const [actioningOrderId, setActioningOrderId] = useState<string | null>(null);
  const [pauseToggling, setPauseToggling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [newOrderAlert, setNewOrderAlert] = useState(false);
  const [activeSection, setActiveSection] = useState<"inProgress" | "ready" | "completed">("inProgress");
  const [cancelConfirmOrder, setCancelConfirmOrder] = useState<Order | null>(null);
  const prevPendingCount = useRef<number | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const sectionY = useRef<Record<"inProgress" | "ready" | "completed", number>>({ inProgress: 0, ready: 0, completed: 0 });
  const navLayout = useRef<Record<"inProgress" | "ready" | "completed", { x: number; width: number }>>({
    inProgress: { x: 0, width: 0 },
    ready: { x: 0, width: 0 },
    completed: { x: 0, width: 0 },
  });
  const indicatorX = useSharedValue(0);
  const indicatorWidth = useSharedValue(0);
  const indicatorStyle = useAnimatedStyle(() => ({
    left: indicatorX.value,
    width: indicatorWidth.value,
  }));
  const brewerStats = useBrewerStats();

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

  useEffect(() => {
    const target = navLayout.current[activeSection];
    if (target.width === 0) return;
    indicatorX.value = withSpring(target.x, { damping: 20, stiffness: 240 });
    indicatorWidth.value = withSpring(target.width, { damping: 20, stiffness: 240 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSection]);

  if (!currentUser) return null;

  if (dataLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.paper }}>
        <ScrollView contentContainerStyle={s.scrollContent}>
          <CardSkeleton lines={2} />
          <CardSkeleton lines={3} />
          <CardSkeleton lines={2} />
        </ScrollView>
      </View>
    );
  }

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

  const handleCancel = (order: Order) => setCancelConfirmOrder(order);

  const confirmCancel = async (order: Order) => {
    setActioningOrderId(order.id);
    try {
      await updateOrderStatus(order.id, "Not Found", order.status);
      setCancelConfirmOrder(null);
    } catch (err) {
      // Modal stays open on failure so the order is still in front of the brewer.
      Alert.alert("Update failed", err instanceof Error ? err.message : "Failed to cancel order.");
    } finally {
      setActioningOrderId(null);
    }
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

  const ordersAhead = pendingOrders.length + inProgressOrders.length;
  const estWaitMins = brewerStats.avgOrderMins !== null && ordersAhead > 0 ? brewerStats.avgOrderMins * ordersAhead : null;

  const renderRows = (list: Order[]) => (
    <FlatList
      data={list}
      keyExtractor={(order) => order.id}
      scrollEnabled={false}
      renderItem={({ item: order, index }) => (
        <OrderRow
          order={order}
          dailyNumber={getDailyOrderNumber(order.id, order.createdAt)}
          isActioning={actioningOrderId === order.id}
          onPrimaryAction={() => handlePrimaryAction(order)}
          onCancel={() => handleCancel(order)}
          isLast={index === list.length - 1}
        />
      )}
    />
  );

  const onSectionLayout = (key: "inProgress" | "ready" | "completed") => (e: LayoutChangeEvent) => {
    sectionY.current[key] = e.nativeEvent.layout.y;
  };

  const scrollToSection = (key: "inProgress" | "ready" | "completed") => {
    setActiveSection(key);
    scrollRef.current?.scrollTo({ y: Math.max(0, sectionY.current[key] - 12), animated: true });
  };

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y + 40;
    const entries = Object.entries(sectionY.current) as ["inProgress" | "ready" | "completed", number][];
    const current = entries.reduce((closest, [key, top]) => (top <= y ? key : closest), "inProgress" as "inProgress" | "ready" | "completed");
    setActiveSection(current);
  };

  const onNavLayout = (key: "inProgress" | "ready" | "completed") => (e: LayoutChangeEvent) => {
    const { x, width } = e.nativeEvent.layout;
    navLayout.current[key] = { x, width };
    // First measurement for the currently-active tab: snap the indicator into
    // place instead of springing in from x=0 on mount.
    if (activeSection === key) {
      indicatorX.value = x;
      indicatorWidth.value = width;
    }
  };

  const navCounts: Record<"inProgress" | "ready" | "completed", number> = {
    inProgress: inProgressList.length,
    ready: readyList.length,
    completed: completedOrders.length,
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.paper }}>
      <ScrollView ref={scrollRef} onScroll={onScroll} scrollEventThrottle={100} contentContainerStyle={s.scrollContent}>
        <Text style={s.headline}>Order Queue</Text>

        {isPaused && (
          <View style={s.pauseBanner}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}>
              <HugeiconsIcon icon={PauseIcon} size={16} color={colors.slateZinc} />
              <Text style={s.pauseBannerText}>Orders Paused — employees can&apos;t order right now.</Text>
            </View>
            <Pressable
              disabled={pauseToggling}
              onPress={handleTogglePause}
              style={s.resumeButton}
              accessibilityRole="button"
              accessibilityLabel="Resume orders"
              accessibilityState={{ disabled: pauseToggling, busy: pauseToggling }}
            >
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
            <Pressable
              onPress={() => setNewOrderAlert(false)}
              style={s.dismissButton}
              accessibilityRole="button"
              accessibilityLabel="Dismiss notification"
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Text style={s.dismissText}>Dismiss</Text>
            </Pressable>
          </View>
        )}

        <OrderStatusSection title="New Orders" subtitle="Waiting to be confirmed and started." count={pendingList.length} emptyMessage="No new orders right now." isEmpty={pendingList.length === 0}>
          {renderRows(pendingList)}
        </OrderStatusSection>

        <View onLayout={onSectionLayout("inProgress")}>
          <OrderStatusSection title="In Progress" subtitle="Orders currently being prepared." count={inProgressList.length} emptyMessage="Nothing being prepared right now." isEmpty={inProgressList.length === 0}>
            {renderRows(inProgressList)}
          </OrderStatusSection>
        </View>

        <View onLayout={onSectionLayout("ready")}>
          <OrderStatusSection title="Ready" subtitle="Prepared and waiting for delivery." count={readyList.length} emptyMessage="No beverages ready yet." isEmpty={readyList.length === 0}>
            {renderRows(readyList)}
          </OrderStatusSection>
        </View>

        <View onLayout={onSectionLayout("completed")}>
          <OrderStatusSection title="Completed" subtitle="Recently completed orders today." count={completedOrders.length} emptyMessage="Nothing completed yet today." isEmpty={completedList.length === 0} collapsible>
            <FlatList
              data={completedList}
              keyExtractor={(order) => order.id}
              scrollEnabled={false}
              renderItem={({ item: order, index }) => (
                <View style={index === completedList.length - 1 ? { borderBottomWidth: 0 } : undefined}>
                  <CompletedOrderRow order={order} dailyNumber={getDailyOrderNumber(order.id, order.createdAt)} />
                </View>
              )}
              ListFooterComponent={hiddenCompletedCount > 0 ? <Text style={s.hiddenCount}>+ {hiddenCompletedCount} more completed today</Text> : null}
            />
          </OrderStatusSection>
        </View>

        {/* Queue-first: the orders the brewer needs to act on lead the page;
            the overview card is a summary you check after, not a gate before. */}
        <QueueSummary ordersAhead={ordersAhead} inPreparation={inProgressOrders.length} ready={readyOrders.length} estWaitMins={estWaitMins} />

        <QuickActions isPaused={isPaused} isTogglingPause={pauseToggling} isRefreshing={isRefreshing} onTogglePause={handleTogglePause} onRefresh={handleRefresh} />
        <BrewerStats {...brewerStats} />
      </ScrollView>

      {!embedded && (
        <View style={[s.navBar, { paddingBottom: insets.bottom + 8 }]}>
          <Animated.View style={[s.navIndicator, indicatorStyle]} />
          {NAV_ITEMS.map((item) => {
            const isActive = activeSection === item.key;
            const count = navCounts[item.key];
            return (
              <Pressable
                key={item.key}
                style={s.navItem}
                onLayout={onNavLayout(item.key)}
                onPress={() => scrollToSection(item.key)}
                accessibilityRole="tab"
                accessibilityLabel={count > 0 ? `${item.label}, ${count}` : item.label}
                accessibilityState={{ selected: isActive }}
              >
                <View>
                  <HugeiconsIcon icon={item.icon} size={20} color={isActive ? colors.ink : colors.softZinc} strokeWidth={isActive ? 2 : 1.5} />
                  {count > 0 && (
                    <View style={s.navBadge}>
                      <Text style={s.navBadgeText}>{count > 9 ? "9+" : count}</Text>
                    </View>
                  )}
                </View>
                <Text style={[s.navLabel, isActive && s.navLabelActive]}>{item.label}</Text>
              </Pressable>
            );
          })}
          <Pressable
            style={s.navItem}
            onPress={() => router.push("/brewer-profile")}
            accessibilityRole="tab"
            accessibilityLabel="Profile"
          >
            <HugeiconsIcon icon={User03Icon} size={20} color={colors.softZinc} strokeWidth={1.5} />
            <Text style={s.navLabel}>Profile</Text>
          </Pressable>
        </View>
      )}

      <Modal visible={!!cancelConfirmOrder} transparent animationType="fade" onRequestClose={() => setCancelConfirmOrder(null)}>
        <Pressable style={s.modalOverlay} onPress={() => setCancelConfirmOrder(null)}>
          <Pressable style={s.modalCard} onPress={(e) => e.stopPropagation()}>
            {cancelConfirmOrder && (
              <>
                <View style={s.modalIconWrap}>
                  <HugeiconsIcon icon={Cancel01Icon} size={22} color={colors.ink} />
                </View>
                <Text style={s.modalTitle}>Mark as Not Found?</Text>
                <Text style={s.modalSubtitle}>
                  {getDailyOrderNumber(cancelConfirmOrder.id, cancelConfirmOrder.createdAt)} · {cancelConfirmOrder.floor} · {cancelConfirmOrder.drink}
                </Text>
                <View style={s.modalActions}>
                  <Pressable style={s.modalKeepButton} onPress={() => setCancelConfirmOrder(null)} accessibilityRole="button" accessibilityLabel="Keep order">
                    <Text style={s.modalKeepText}>Keep Order</Text>
                  </Pressable>
                  <Pressable
                    disabled={actioningOrderId === cancelConfirmOrder.id}
                    style={s.modalCancelButton}
                    onPress={() => confirmCancel(cancelConfirmOrder)}
                    accessibilityRole="button"
                    accessibilityLabel="Yes, cancel order"
                  >
                    <Text style={s.modalCancelText}>{actioningOrderId === cancelConfirmOrder.id ? "…" : "Yes, Cancel"}</Text>
                  </Pressable>
                </View>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = (colors: ColorRamp) =>
  StyleSheet.create({
    scrollContent: { padding: 16, gap: 10, paddingBottom: 100 },
    headline: { fontSize: 22, fontWeight: "800", letterSpacing: -0.3, color: colors.ink, marginBottom: 2 },
    pauseBanner: { flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1, borderColor: colors.dividerZinc, backgroundColor: colors.surfaceZinc, borderRadius: 10, padding: 10 },
    pauseBannerText: { fontSize: 12, fontWeight: "600", color: colors.slateZinc, flex: 1 },
    resumeButton: { justifyContent: "center", backgroundColor: colors.ink, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
    resumeButtonText: { color: colors.white, fontSize: 11, fontWeight: "700" },
    newOrderBanner: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: colors.ink, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 12 },
    newOrderText: { fontSize: 12, fontWeight: "700", color: colors.white, flex: 1 },
    dismissButton: { paddingVertical: 4, paddingHorizontal: 4, alignItems: "center", justifyContent: "center" },
    dismissText: { fontSize: 11, fontWeight: "700", color: colors.white, opacity: 0.8 },
    hiddenCount: { fontSize: 11, fontWeight: "600", color: colors.softZinc, paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.dividerZinc },
    navBar: {
      flexDirection: "row",
      borderTopWidth: 1,
      borderTopColor: colors.dividerZinc,
      backgroundColor: colors.paper,
      paddingTop: 8,
    },
    navItem: { flex: 1, minHeight: 44, alignItems: "center", justifyContent: "center", gap: 3 },
    navLabel: { fontSize: 11, fontWeight: "600", color: colors.softZinc },
    navLabelActive: { color: colors.ink, fontWeight: "700" },
    navIndicator: { position: "absolute", top: 0, height: 2, borderRadius: 999, backgroundColor: colors.ink },
    navBadge: { position: "absolute", top: -4, right: -8, minWidth: 15, height: 15, paddingHorizontal: 3, borderRadius: 999, backgroundColor: colors.ink, alignItems: "center", justifyContent: "center" },
    navBadgeText: { fontSize: 9, fontWeight: "700", color: colors.white },
    modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", alignItems: "center", justifyContent: "center", padding: 16 },
    modalCard: { width: "100%", maxWidth: 380, borderRadius: 16, backgroundColor: colors.white, padding: 24, gap: 4, alignItems: "center" },
    modalIconWrap: { width: 40, height: 40, borderRadius: 9999, backgroundColor: colors.surfaceZinc, alignItems: "center", justifyContent: "center", marginBottom: 8 },
    modalTitle: { fontSize: 16, fontWeight: "700", color: colors.ink },
    modalSubtitle: { fontSize: 12, fontWeight: "600", color: colors.quietZinc, marginTop: 4, textAlign: "center" },
    modalActions: { flexDirection: "row", gap: 10, marginTop: 16, width: "100%" },
    modalKeepButton: { flex: 1, minHeight: 44, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.hairlineZinc, borderRadius: 8, backgroundColor: colors.white },
    modalKeepText: { fontSize: 13, fontWeight: "700", color: colors.slateZinc },
    modalCancelButton: { flex: 1, minHeight: 44, alignItems: "center", justifyContent: "center", borderRadius: 8, backgroundColor: colors.ink },
    modalCancelText: { fontSize: 13, fontWeight: "700", color: colors.white },
  });
