import { useEffect, useRef, useState } from "react";
import { View, Text, ScrollView, Pressable, Alert, StyleSheet, FlatList, type LayoutChangeEvent, type NativeSyntheticEvent, type NativeScrollEvent } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { PauseIcon, Notification01Icon, PlayIcon, CheckmarkCircle02Icon, ListViewIcon, User03Icon } from "@hugeicons/core-free-icons";
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
  const prevPendingCount = useRef<number | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const sectionY = useRef<Record<"inProgress" | "ready" | "completed", number>>({ inProgress: 0, ready: 0, completed: 0 });
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

  const ordersAhead = pendingOrders.length + inProgressOrders.length;
  const estWaitMins = brewerStats.avgOrderMins !== null && ordersAhead > 0 ? brewerStats.avgOrderMins * ordersAhead : null;

  const renderRows = (list: Order[]) => (
    <FlatList
      data={list}
      keyExtractor={(order) => order.id}
      scrollEnabled={false}
      renderItem={({ item: order, index }) => (
        <View style={index === list.length - 1 ? { borderBottomWidth: 0 } : undefined}>
          <OrderRow
            order={order}
            dailyNumber={getDailyOrderNumber(order.id, order.createdAt)}
            isActioning={actioningOrderId === order.id}
            onPrimaryAction={() => handlePrimaryAction(order)}
            onCancel={() => handleCancel(order)}
          />
        </View>
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
              hitSlop={8}
            >
              <Text style={s.dismissText}>Dismiss</Text>
            </Pressable>
          </View>
        )}

        <QueueSummary ordersAhead={ordersAhead} inPreparation={inProgressOrders.length} ready={readyOrders.length} estWaitMins={estWaitMins} />

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

        <QuickActions isPaused={isPaused} isTogglingPause={pauseToggling} isRefreshing={isRefreshing} onTogglePause={handleTogglePause} onRefresh={handleRefresh} />
        <BrewerStats {...brewerStats} />
      </ScrollView>

      {!embedded && (
        <View style={[s.navBar, { paddingBottom: insets.bottom + 8 }]}>
          {NAV_ITEMS.map((item) => {
            const isActive = activeSection === item.key;
            return (
              <Pressable
                key={item.key}
                style={s.navItem}
                onPress={() => scrollToSection(item.key)}
                accessibilityRole="tab"
                accessibilityLabel={item.label}
                accessibilityState={{ selected: isActive }}
              >
                <HugeiconsIcon icon={item.icon} size={20} color={isActive ? colors.ink : colors.softZinc} strokeWidth={isActive ? 2 : 1.5} />
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
    </View>
  );
}

const styles = (colors: ColorRamp) =>
  StyleSheet.create({
    scrollContent: { padding: 16, gap: 16, paddingBottom: 100 },
    headline: { fontSize: 22, fontWeight: "800", letterSpacing: -0.3, color: colors.ink },
    pauseBanner: { flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1, borderColor: colors.dividerZinc, backgroundColor: colors.surfaceZinc, borderRadius: 10, padding: 12 },
    pauseBannerText: { fontSize: 12, fontWeight: "600", color: colors.slateZinc, flex: 1 },
    resumeButton: { minHeight: 44, justifyContent: "center", backgroundColor: colors.ink, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
    resumeButtonText: { color: colors.white, fontSize: 11, fontWeight: "700" },
    newOrderBanner: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: colors.ink, borderRadius: 10, padding: 12 },
    newOrderText: { fontSize: 12, fontWeight: "700", color: colors.white, flex: 1 },
    dismissButton: { minHeight: 44, minWidth: 44, alignItems: "center", justifyContent: "center" },
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
  });
