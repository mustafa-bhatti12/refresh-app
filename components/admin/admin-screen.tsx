import { useState } from "react";
import { View, Text, ScrollView, Pressable, Platform, StyleSheet, KeyboardAvoidingView } from "react-native";
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

export function AdminScreen() {
  const colors = useColors();
  const s = styles(colors);
  const router = useRouter();
  const {
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
    dataLoading,
  } = useRefresh();

  const [filterMode, setFilterMode] = useState<"day" | "all">("day");
  const [selectedFilterDate, setSelectedFilterDate] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const activeFilterDate = selectedFilterDate || systemDate;

  const dayOrders = filterMode === "all" ? orders : orders.filter((o) => o.createdAt.split("T")[0] === activeFilterDate);
  const dayReviews = filterMode === "all" ? reviews : reviews.filter((r) => r.createdAt.split("T")[0] === activeFilterDate);
  const avgRating = dayReviews.length ? (dayReviews.reduce((acc, r) => acc + r.rating, 0) / dayReviews.length).toFixed(1) : "N/A";

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
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.paper }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={s.scrollContent}>
        <View>
          <Text style={s.headline}>Admin Control Panel</Text>
          <Text style={s.subheadline}>Today&apos;s Date: {systemDate}</Text>
        </View>

        <Text style={s.filterLabel}>Filter</Text>
        <View style={s.filterRow}>
          <Pressable
            onPress={() => {
              setSelectedFilterDate("");
              setFilterMode("day");
            }}
            style={[s.filterChip, filterMode === "day" && activeFilterDate === systemDate && s.filterChipActive]}
            accessibilityRole="button"
            accessibilityLabel="Today"
            accessibilityState={{ selected: filterMode === "day" && activeFilterDate === systemDate }}
          >
            <HugeiconsIcon icon={Sun01Icon} size={13} color={filterMode === "day" && activeFilterDate === systemDate ? colors.white : colors.slateZinc} />
            <Text style={[s.filterChipText, filterMode === "day" && activeFilterDate === systemDate && s.filterChipTextActive]}>Today</Text>
          </Pressable>
          <Pressable
            onPress={() => setFilterMode("all")}
            style={[s.filterChip, filterMode === "all" && s.filterChipActive]}
            accessibilityRole="button"
            accessibilityLabel="All time"
            accessibilityState={{ selected: filterMode === "all" }}
          >
            <HugeiconsIcon icon={GlobeIcon} size={13} color={filterMode === "all" ? colors.white : colors.slateZinc} />
            <Text style={[s.filterChipText, filterMode === "all" && s.filterChipTextActive]}>All Time</Text>
          </Pressable>
          <Pressable
            onPress={() => setShowDatePicker(true)}
            style={[s.filterChip, filterMode === "day" && activeFilterDate !== systemDate && s.filterChipActive]}
            accessibilityRole="button"
            accessibilityLabel={activeFilterDate === systemDate ? "Pick date" : `Filter by ${activeFilterDate}`}
            accessibilityState={{ selected: filterMode === "day" && activeFilterDate !== systemDate }}
          >
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

        <Pressable
          onPress={() => router.push("/admin-feedback")}
          style={s.feedbackLink}
          accessibilityRole="button"
          accessibilityLabel="View all feedback"
        >
          <Text style={s.feedbackLinkText}>View All Feedback →</Text>
        </Pressable>

        <View style={s.card}>
          <Text style={s.title}>Office Floors</Text>
          <Text style={s.subtitle}>Fixed building floors. Employees pick one during onboarding.</Text>
          <View style={s.floorChipRow}>
            {floors.map((floor) => (
              <View key={floor} style={s.floorChip}>
                <Text style={s.floorChipText}>{floor}</Text>
              </View>
            ))}
          </View>
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
          brewers={brewers}
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
    </KeyboardAvoidingView>
  );
}

const styles = (colors: ColorRamp) =>
  StyleSheet.create({
    scrollContent: { padding: 16, gap: 16, paddingBottom: 40 },
    headline: { fontSize: 24, fontWeight: "800", letterSpacing: -0.3, color: colors.ink },
    subheadline: { fontSize: 12, color: colors.softZinc, marginTop: 2 },
    filterLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 0.6, textTransform: "uppercase", color: colors.softZinc, marginTop: -4 },
    filterRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
    filterChip: { flexDirection: "row", alignItems: "center", gap: 5, borderWidth: 1, borderColor: colors.hairlineZinc, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7, backgroundColor: colors.white },
    filterChipActive: { backgroundColor: colors.ink, borderColor: colors.ink },
    filterChipText: { fontSize: 11, fontWeight: "700", color: colors.slateZinc },
    filterChipTextActive: { color: colors.white },
    feedbackLink: { minHeight: 44, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.dividerZinc, borderRadius: 10, padding: 14, alignItems: "center", justifyContent: "center" },
    feedbackLinkText: { fontSize: 13, fontWeight: "700", color: colors.ink },
    card: { borderRadius: 12, borderWidth: 1, borderColor: colors.dividerZinc, backgroundColor: colors.white, padding: 20 },
    title: { fontSize: 15, fontWeight: "700", color: colors.ink },
    subtitle: { fontSize: 11, color: colors.softZinc, marginTop: 4, marginBottom: 8 },
    floorChipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    floorChip: { borderWidth: 1, borderColor: colors.hairlineZinc, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7, backgroundColor: colors.white },
    floorChipText: { fontSize: 12, fontWeight: "600", color: colors.slateZinc },
  });
