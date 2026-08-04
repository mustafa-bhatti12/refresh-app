import { useEffect, useState } from "react";
import { View, Text, ScrollView, Alert, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
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
  const { currentUser, orders, brewers, cooldownLimitEnabled, placeOrder, dataLoading } = useRefresh();

  const [hasActiveOrder, setHasActiveOrder] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [toast, setToast] = useState<string | null>(null);

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
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.paper }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={s.scrollContent}>
        <View style={s.headerRow}>
          <Text style={s.headline}>Place an Order</Text>
        </View>

        <OrderForm
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
    </KeyboardAvoidingView>
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
