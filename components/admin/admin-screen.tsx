import { useState } from "react";
import { View, Text, ScrollView, Pressable, Platform, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { Sun01Icon, GlobeIcon, Calendar01Icon } from "@hugeicons/core-free-icons";
import { useColors } from "@/constants/use-colors";
import type { ColorRamp } from "@/constants/colors";
import { useRefresh } from "@/context/RefreshContext";
import { CardSkeleton } from "@/components/card-skeleton";
import { AnalyticsPanel } from "./analytics-panel";
import { EmployeesPanel } from "./employees-panel";
import { BrewersPanel } from "./brewers-panel";
import { ServiceHoursPanel } from "./service-hours-panel";
import { BeveragePanel } from "./beverage-panel";
import { OrderHistoryPanel } from "./order-history-panel";
import { ReviewModal } from "@/components/order/review-modal";

export function AdminScreen() {
  const colors = useColors();
  const s = styles(colors);
  const router = useRouter();
  const {
    currentUser,
    orders,
    reviews,
    floors,
    drinks,
    employees,
    brewers,
    brewerInvites,
    beverages,
    serviceHours,
    cooldownLimitEnabled,
    systemDate,
    deleteEmployee,
    addBrewer,
    removeBrewerInvite,
    deleteBrewer,
    updateBrewer,
    updateBrewerStatus,
    addServiceHour,
    updateServiceHour,
    deleteServiceHour,
    toggleCooldownLimit,
    addBeverage,
    toggleBeverageEnabled,
    deleteBeverage,
    getDailyOrderNumber,
    submitReview,
    logout,
    dataLoading,
  } = useRefresh();

  const [filterMode, setFilterMode] = useState<"day" | "all">("day");
  const [selectedFilterDate, setSelectedFilterDate] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const activeFilterDate = selectedFilterDate || systemDate;

  const dayOrders = filterMode === "all" ? orders : orders.filter((o) => o.createdAt.split("T")[0] === activeFilterDate);
  const dayReviews = filterMode === "all" ? reviews : reviews.filter((r) => r.createdAt.split("T")[0] === activeFilterDate);
  const avgRating = dayReviews.length ? (dayReviews.reduce((acc, r) => acc + r.rating, 0) / dayReviews.length).toFixed(1) : "N/A";

  const unreviewedOrder = currentUser
    ? orders.find(
        (o) =>
          o.employeeId === currentUser.id &&
          o.status === "Delivered" &&
          o.feedbackComments !== "__NOT_FOUND__" &&
          (o.feedbackRating === undefined || o.feedbackRating === null)
      )
    : undefined;

  if (dataLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.paper }}>
        <ScrollView contentContainerStyle={s.scrollContent}>
          <CardSkeleton lines={3} />
          <CardSkeleton lines={4} />
          <CardSkeleton lines={2} />
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.paper }}>
      <ScrollView contentContainerStyle={s.scrollContent}>
        <View style={s.topRow}>
          <View style={{ flex: 1 }}>
            <Text style={s.headline}>Admin Control Panel</Text>
            <Text style={s.subheadline}>Today: {systemDate}</Text>
          </View>
          <Pressable onPress={() => logout()} style={s.logoutButton}>
            <Text style={s.logoutText}>Log Out</Text>
          </Pressable>
        </View>

        <View style={s.filterRow}>
          <Pressable
            onPress={() => {
              setSelectedFilterDate("");
              setFilterMode("day");
            }}
            style={[s.filterChip, filterMode === "day" && activeFilterDate === systemDate && s.filterChipActive]}
          >
            <HugeiconsIcon icon={Sun01Icon} size={13} color={filterMode === "day" && activeFilterDate === systemDate ? colors.white : colors.slateZinc} />
            <Text style={[s.filterChipText, filterMode === "day" && activeFilterDate === systemDate && s.filterChipTextActive]}>Today</Text>
          </Pressable>
          <Pressable onPress={() => setFilterMode("all")} style={[s.filterChip, filterMode === "all" && s.filterChipActive]}>
            <HugeiconsIcon icon={GlobeIcon} size={13} color={filterMode === "all" ? colors.white : colors.slateZinc} />
            <Text style={[s.filterChipText, filterMode === "all" && s.filterChipTextActive]}>All Time</Text>
          </Pressable>
          <Pressable onPress={() => setShowDatePicker(true)} style={[s.filterChip, filterMode === "day" && activeFilterDate !== systemDate && s.filterChipActive]}>
            <HugeiconsIcon icon={Calendar01Icon} size={13} color={filterMode === "day" && activeFilterDate !== systemDate ? colors.white : colors.slateZinc} />
            <Text style={[s.filterChipText, filterMode === "day" && activeFilterDate !== systemDate && s.filterChipTextActive]}>{activeFilterDate === systemDate ? "Pick date" : activeFilterDate}</Text>
          </Pressable>
        </View>
        {showDatePicker && (
          <DateTimePicker
            value={new Date(activeFilterDate)}
            mode="date"
            maximumDate={new Date(systemDate)}
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={(_, date) => {
              setShowDatePicker(Platform.OS === "ios");
              if (date) {
                setSelectedFilterDate(date.toISOString().split("T")[0]);
                setFilterMode("day");
              }
            }}
          />
        )}

        <AnalyticsPanel dayOrders={dayOrders} floors={floors} drinks={drinks} avgRating={avgRating} totalReviews={dayReviews.length} brewers={brewers} />

        <Pressable onPress={() => router.push("/admin-feedback")} style={s.feedbackLink}>
          <Text style={s.feedbackLinkText}>View All Feedback →</Text>
        </Pressable>

        <View style={s.card}>
          <Text style={s.title}>Office Floors</Text>
          <Text style={s.subtitle}>Fixed building floors. Employees pick one during onboarding.</Text>
          {floors.map((floor, idx) => (
            <Text key={floor} style={[s.floorRow, idx === floors.length - 1 && { borderBottomWidth: 0 }]}>{floor}</Text>
          ))}
        </View>

        <EmployeesPanel employees={employees} onDelete={deleteEmployee} />

        <BrewersPanel
          brewers={brewers}
          brewerInvites={brewerInvites}
          onAddBrewer={addBrewer}
          onRemoveInvite={removeBrewerInvite}
          onDeleteBrewer={deleteBrewer}
          onUpdateBrewer={updateBrewer}
          onUpdateBrewerStatus={updateBrewerStatus}
        />

        <ServiceHoursPanel
          serviceHours={serviceHours}
          cooldownLimitEnabled={cooldownLimitEnabled}
          onAdd={addServiceHour}
          onUpdate={updateServiceHour}
          onDelete={deleteServiceHour}
          onToggleCooldown={toggleCooldownLimit}
        />

        <BeveragePanel beverages={beverages} onAdd={addBeverage} onToggle={toggleBeverageEnabled} onDelete={deleteBeverage} />

        <OrderHistoryPanel orders={dayOrders} getDailyOrderNumber={getDailyOrderNumber} />
      </ScrollView>

      {unreviewedOrder && (
        <ReviewModal
          order={unreviewedOrder}
          dailyNumber={getDailyOrderNumber(unreviewedOrder.id, unreviewedOrder.createdAt)}
          mandatory
          onSubmit={async (rating, comments) => {
            await submitReview(unreviewedOrder.id, rating, comments);
          }}
          onCancel={() => {}}
        />
      )}
    </View>
  );
}

const styles = (colors: ColorRamp) =>
  StyleSheet.create({
    scrollContent: { padding: 16, gap: 16, paddingBottom: 40 },
    topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 12 },
    headline: { fontSize: 24, fontWeight: "800", letterSpacing: -0.3, color: colors.ink },
    subheadline: { fontSize: 12, color: colors.softZinc, marginTop: 2 },
    logoutButton: { borderWidth: 1, borderColor: colors.hairlineZinc, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: colors.white },
    logoutText: { fontSize: 12, fontWeight: "700", color: colors.slateZinc },
    filterRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
    filterChip: { flexDirection: "row", alignItems: "center", gap: 5, borderWidth: 1, borderColor: colors.hairlineZinc, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7, backgroundColor: colors.white },
    filterChipActive: { backgroundColor: colors.ink, borderColor: colors.ink },
    filterChipText: { fontSize: 11, fontWeight: "700", color: colors.slateZinc },
    filterChipTextActive: { color: colors.white },
    feedbackLink: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.dividerZinc, borderRadius: 10, padding: 14, alignItems: "center" },
    feedbackLinkText: { fontSize: 13, fontWeight: "700", color: colors.ink },
    card: { borderRadius: 12, borderWidth: 1, borderColor: colors.dividerZinc, backgroundColor: colors.white, padding: 20 },
    title: { fontSize: 15, fontWeight: "700", color: colors.ink },
    subtitle: { fontSize: 11, color: colors.softZinc, marginTop: 4, marginBottom: 8 },
    floorRow: { fontSize: 13, fontWeight: "600", color: colors.slateZinc, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.dividerZinc },
  });
