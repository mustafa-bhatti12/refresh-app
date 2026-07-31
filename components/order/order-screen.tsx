import { useEffect, useState } from "react";
import { View, Text, ScrollView, Alert, StyleSheet } from "react-native";
import { useColors } from "@/constants/use-colors";
import type { ColorRamp } from "@/constants/colors";
import { useRefresh } from "@/context/RefreshContext";
import { writeSavedFloor } from "@/lib/saved-floor";
import { CardSkeleton } from "@/components/card-skeleton";
import { OrderForm } from "./order-form";
import { BrewersBoard } from "./brewers-board";
import { OrderInfo } from "./order-info";

const COOLDOWN_MINS = 180;

export function OrderScreen() {
  const colors = useColors();
  const s = styles(colors);
  const { currentUser, orders, brewers, serviceHours, cooldownLimitEnabled, placeOrder, dataLoading } = useRefresh();

  const [isAvailable, setIsAvailable] = useState(true);
  const [hasActiveOrder, setHasActiveOrder] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [toast, setToast] = useState<string | null>(null);

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

  const announce = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const handlePlaceOrder = async (floor: string, drink: string, sugar: string, strength: string, note: string) => {
    try {
      await placeOrder(floor, drink, sugar, strength, note);
      void writeSavedFloor(floor);
      announce(`Order placed successfully for ${drink}!`);
    } catch (err) {
      Alert.alert("Order failed", err instanceof Error ? err.message : "Failed to place order.");
    }
  };

  if (dataLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.paper }}>
        <ScrollView contentContainerStyle={s.scrollContent}>
          <CardSkeleton lines={4} />
          <CardSkeleton lines={2} />
          <CardSkeleton lines={2} />
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.paper }}>
      <ScrollView contentContainerStyle={s.scrollContent}>
        <View style={s.headerRow}>
          <Text style={s.headline}>Place an Order</Text>
        </View>

        <OrderForm
          isAvailable={isAvailable}
          hasActiveOrder={hasActiveOrder}
          cooldownRemaining={cooldownRemaining}
          noBrewersActive={noBrewersActive}
          onSubmit={handlePlaceOrder}
        />

        <BrewersBoard brewers={brewers} />
        <OrderInfo />
      </ScrollView>

      {toast && (
        <View style={s.toast}>
          <Text style={s.toastText}>{toast}</Text>
        </View>
      )}
    </View>
  );
}

const styles = (colors: ColorRamp) =>
  StyleSheet.create({
    scrollContent: { padding: 16, gap: 16, paddingBottom: 40 },
    headerRow: { gap: 4 },
    headline: { fontSize: 28, fontWeight: "800", letterSpacing: -0.4, color: colors.ink },
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
