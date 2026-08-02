import { useState } from "react";
import { View, Text, FlatList, Pressable, Platform, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  ArrowLeft01Icon,
  Sun01Icon,
  GlobeIcon,
  Calendar01Icon,
  StarIcon,
  Sad02Icon,
  UnhappyIcon,
  SmileIcon,
  Happy01Icon,
  SmileDizzyIcon,
  HelpCircleIcon,
  UserIcon,
} from "@hugeicons/core-free-icons";
import { useColors } from "@/constants/use-colors";
import type { ColorRamp } from "@/constants/colors";
import { useRefresh, type Review } from "@/context/RefreshContext";

const REACTION_MAP: Record<number, { icon: typeof Sad02Icon; label: string }> = {
  1: { icon: Sad02Icon, label: "Poor" },
  2: { icon: UnhappyIcon, label: "OK" },
  3: { icon: SmileIcon, label: "Good" },
  4: { icon: Happy01Icon, label: "Delicious" },
  5: { icon: SmileDizzyIcon, label: "Amazing!" },
};

export function FeedbackScreen() {
  const colors = useColors();
  const s = styles(colors);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { reviews, systemDate, getDailyOrderNumber } = useRefresh();

  const [filterMode, setFilterMode] = useState<"day" | "all">("all");
  const [selectedFilterDate, setSelectedFilterDate] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const activeFilterDate = selectedFilterDate || systemDate;

  const dayReviews = filterMode === "all" ? reviews : reviews.filter((r) => r.createdAt.split("T")[0] === activeFilterDate);
  const sorted = [...dayReviews].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const avgRating = sorted.length ? (sorted.reduce((acc, r) => acc + r.rating, 0) / sorted.length).toFixed(1) : "N/A";

  const renderHeader = () => (
    <View style={s.headerBlock}>
      <Pressable
        onPress={() => router.back()}
        style={s.backLink}
        accessibilityRole="button"
        accessibilityLabel="Back to admin dashboard"
        hitSlop={8}
      >
        <HugeiconsIcon icon={ArrowLeft01Icon} size={14} color={colors.quietZinc} />
        <Text style={s.backLinkText}>Back to Admin Dashboard</Text>
      </Pressable>

      <Text style={s.headline}>Feedback & Ratings</Text>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        <Text style={s.subheadline}>
          {sorted.length} review{sorted.length !== 1 ? "s" : ""} · Avg {avgRating}
        </Text>
        {avgRating !== "N/A" && <HugeiconsIcon icon={StarIcon} size={13} color={colors.slateZinc} />}
      </View>

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
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.paper }}>
      <FlatList
        contentContainerStyle={[s.scrollContent, { paddingTop: insets.top + 16 }]}
        data={sorted}
        keyExtractor={(rev) => rev.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <View style={s.emptyCard}>
            <Text style={s.emptyText}>No reviews submitted for {filterMode === "all" ? "All Time" : activeFilterDate}.</Text>
          </View>
        }
        renderItem={({ item: rev }: { item: Review }) => {
          const reaction = REACTION_MAP[rev.rating] || { icon: HelpCircleIcon, label: "" };
          return (
            <View style={s.reviewCard}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                <View style={{ flex: 1 }}>
                  <Text style={s.reviewName}>{rev.employeeName}</Text>
                  <Text style={s.reviewMeta}>{getDailyOrderNumber(rev.orderId, rev.createdAt)} · {rev.drinkName}</Text>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <HugeiconsIcon icon={reaction.icon} size={18} color={colors.slateZinc} />
                  <View style={s.reactionPill}>
                    <Text style={s.reactionPillText}>{reaction.label}</Text>
                  </View>
                </View>
              </View>
              {rev.comments ? <Text style={s.comments}>&ldquo;{rev.comments}&rdquo;</Text> : null}
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 8 }}>
                {rev.brewerName ? (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                    <HugeiconsIcon icon={UserIcon} size={11} color={colors.softZinc} />
                    <Text style={s.brewedBy}>Brewed by {rev.brewerName}</Text>
                  </View>
                ) : (
                  <View />
                )}
                <Text style={s.timestamp}>
                  {new Date(rev.createdAt).toLocaleDateString()} {new Date(rev.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </Text>
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = (colors: ColorRamp) =>
  StyleSheet.create({
    scrollContent: { padding: 16, gap: 12, paddingBottom: 40 },
    headerBlock: { gap: 4, marginBottom: 4 },
    backLink: { minHeight: 44, flexDirection: "row", alignItems: "center", gap: 5, alignSelf: "flex-start" },
    backLinkText: { fontSize: 12, fontWeight: "600", color: colors.quietZinc },
    headline: { fontSize: 24, fontWeight: "800", letterSpacing: -0.3, color: colors.ink },
    subheadline: { fontSize: 12, color: colors.softZinc },
    filterRow: { flexDirection: "row", gap: 8, flexWrap: "wrap", marginTop: 4 },
    filterChip: { minHeight: 44, flexDirection: "row", alignItems: "center", gap: 5, borderWidth: 1, borderColor: colors.hairlineZinc, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7, backgroundColor: colors.white },
    filterChipActive: { backgroundColor: colors.ink, borderColor: colors.ink },
    filterChipText: { fontSize: 11, fontWeight: "700", color: colors.slateZinc },
    filterChipTextActive: { color: colors.white },
    emptyCard: { borderRadius: 12, borderWidth: 1, borderColor: colors.dividerZinc, backgroundColor: colors.white, padding: 32, alignItems: "center" },
    emptyText: { fontSize: 12, color: colors.softZinc, textAlign: "center" },
    reviewCard: { borderRadius: 10, borderWidth: 1, borderColor: colors.dividerZinc, backgroundColor: colors.white, padding: 14 },
    reviewName: { fontSize: 13, fontWeight: "700", color: colors.ink },
    reviewMeta: { fontSize: 11, fontWeight: "700", color: colors.softZinc, marginTop: 1 },
    reactionPill: { backgroundColor: colors.surfaceZinc, borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2 },
    reactionPillText: { fontSize: 11, fontWeight: "700", color: colors.midZinc },
    comments: { fontSize: 12, color: colors.slateZinc, backgroundColor: colors.surfaceZinc, borderRadius: 6, padding: 8, marginTop: 8 },
    brewedBy: { fontSize: 11, fontWeight: "600", color: colors.softZinc },
    timestamp: { fontSize: 11, color: colors.softZinc },
  });
