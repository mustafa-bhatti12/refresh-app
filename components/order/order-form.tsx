import { useEffect, useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  CheckmarkCircle01Icon,
  CheckmarkCircle02Icon,
  Cancel01Icon,
  Note01Icon,
  ArrowDown01Icon,
  SendingOrderIcon,
  Alert02Icon,
  HourglassIcon,
  Clock01Icon,
} from "@hugeicons/core-free-icons";
import { useColors } from "@/constants/use-colors";
import type { ColorRamp } from "@/constants/colors";
import { useRefresh } from "@/context/RefreshContext";
import { getBeverageIcon } from "@/lib/beverage-icons";
import { readSavedFloor } from "@/lib/saved-floor";

function formatCooldown(mins: number) {
  if (mins <= 0) return "";
  const hrs = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  if (hrs > 0) {
    return `${hrs} hour${hrs > 1 ? "s" : ""}${remainingMins > 0 ? ` and ${remainingMins} minute${remainingMins !== 1 ? "s" : ""}` : ""}`;
  }
  return `${remainingMins} minute${remainingMins !== 1 ? "s" : ""}`;
}

export function OrderForm({
  hasActiveOrder,
  cooldownRemaining,
  noBrewersActive,
  onSubmit,
}: {
  hasActiveOrder: boolean;
  cooldownRemaining: number;
  noBrewersActive: boolean;
  onSubmit: (floor: string, drink: string, sugar: string, strength: string, note: string) => Promise<void>;
}) {
  const colors = useColors();
  const s = styles(colors);
  const { floors, beverages, sugarOptions, strengthOptions, currentUser } = useRefresh();

  const [floor, setFloor] = useState(currentUser?.floor || floors[0] || "");
  const [drink, setDrink] = useState(beverages.find((b) => b.enabled)?.name || "");
  const [sugar, setSugar] = useState(sugarOptions[0] || "");
  const [note, setNote] = useState("");
  const [showNote, setShowNote] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (currentUser?.floor) return;
    readSavedFloor().then((saved) => {
      if (saved && floors.includes(saved)) setFloor(saved);
    });
    // Only ever check once on mount — the user's own selection afterward should win.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const defaultStrength = strengthOptions[1] || strengthOptions[0] || "";

  const handleSubmit = async () => {
    if (!floor || !drink || !sugar) return;
    setSubmitting(true);
    try {
      await onSubmit(floor, drink, sugar, defaultStrength, note);
      setNote("");
      setShowNote(false);
    } finally {
      setSubmitting(false);
    }
  };

  const isAdmin = currentUser?.role === "Admin";

  return (
    <View style={s.card}>
      {/* 01 Floor */}
      <View style={s.section}>
        <View style={s.sectionHeader}>
          <View style={s.stepBadge}>
            <Text style={s.stepBadgeText}>01</Text>
          </View>
          <Text style={s.sectionTitle}>Where should we deliver it?</Text>
        </View>
        <View style={s.chipRow}>
          {floors.map((f) => {
            const selected = floor === f;
            return (
              <Pressable
                key={f}
                onPress={() => setFloor(f)}
                style={[s.floorChip, selected && s.chipActive]}
                accessibilityRole="button"
                accessibilityLabel={`Floor ${f}`}
                accessibilityState={{ selected }}
              >
                <Text style={[s.floorChipText, selected && s.chipTextActive]}>{f}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* 02 Drink */}
      <View style={s.section}>
        <View style={s.sectionHeader}>
          <View style={s.stepBadge}>
            <Text style={s.stepBadgeText}>02</Text>
          </View>
          <Text style={s.sectionTitle}>What would you like?</Text>
        </View>
        <View style={s.drinkGrid}>
          {beverages.map((bev) => {
            const selected = drink === bev.name;
            const DrinkIcon = getBeverageIcon(bev.icon);
            return (
              <Pressable
                key={bev.id}
                disabled={!bev.enabled}
                onPress={() => setDrink(bev.name)}
                style={[s.drinkTile, !bev.enabled && s.drinkTileDisabled, selected && bev.enabled && s.drinkTileSelected]}
                accessibilityRole="button"
                accessibilityLabel={bev.enabled ? bev.name : `${bev.name}, unavailable`}
                accessibilityState={{ selected: selected && bev.enabled, disabled: !bev.enabled }}
              >
                {selected && bev.enabled && (
                  <View style={s.drinkCheck}>
                    <HugeiconsIcon icon={CheckmarkCircle02Icon} size={12} color={colors.white} />
                  </View>
                )}
                <HugeiconsIcon icon={DrinkIcon} size={26} color={colors.ink} />
                <Text style={s.drinkName} numberOfLines={1}>{bev.name}</Text>
                {!bev.enabled && <Text style={s.drinkUnavailable}>Unavailable</Text>}
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* 03 Preferences */}
      <View style={s.section}>
        <View style={s.sectionHeader}>
          <View style={s.stepBadge}>
            <Text style={s.stepBadgeText}>03</Text>
          </View>
          <Text style={s.sectionTitle}>Preferences</Text>
        </View>
        <Text style={s.label}>Sugar</Text>
        <View style={s.chipRow2col}>
          {sugarOptions.map((opt) => {
            const selected = sugar === opt;
            return (
              <Pressable
                key={opt}
                onPress={() => setSugar(opt)}
                style={[s.prefChip, selected && s.chipActive]}
                accessibilityRole="button"
                accessibilityLabel={opt === "Sugar" ? "With Sugar" : "Sugar-Free"}
                accessibilityState={{ selected }}
              >
                <HugeiconsIcon icon={opt === "Sugar" ? CheckmarkCircle01Icon : Cancel01Icon} size={15} color={selected ? colors.white : colors.slateZinc} />
                <Text style={[s.prefChipText, selected && s.chipTextActive]}>{opt === "Sugar" ? "With Sugar" : "Sugar-Free"}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* 04 Note */}
      <View style={s.section}>
        <View style={s.sectionHeader}>
          <View style={s.stepBadge}>
            <Text style={s.stepBadgeText}>04</Text>
          </View>
          <Text style={s.sectionTitle}>Anything else?</Text>
        </View>
        <Pressable
          onPress={() => setShowNote((v) => !v)}
          style={s.noteToggle}
          accessibilityRole="button"
          accessibilityLabel={showNote || note ? "Note" : "Add a note"}
          accessibilityState={{ expanded: showNote }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <HugeiconsIcon icon={Note01Icon} size={16} color={colors.quietZinc} />
            <Text style={s.noteToggleText}>{showNote || note ? "Note" : "Add a note"}</Text>
          </View>
          <HugeiconsIcon icon={ArrowDown01Icon} size={16} color={colors.quietZinc} />
        </Pressable>
        {showNote && (
          <TextInput
            value={note}
            onChangeText={setNote}
            multiline
            numberOfLines={2}
            placeholder="e.g. Less sugar, extra hot, etc."
            placeholderTextColor={colors.softZinc}
            style={s.noteInput}
            accessibilityLabel="Order note"
          />
        )}
      </View>

      {floor && drink && sugar && (
        <Text style={s.summary}>
          {floor} · {drink} · {sugar === "Sugar" ? "With Sugar" : "Sugar-Free"}
        </Text>
      )}

      {noBrewersActive ? (
        <View style={s.blockedBoxSoft}>
          <HugeiconsIcon icon={Alert02Icon} size={16} color={colors.midZinc} />
          <Text style={s.blockedTextSoft}>Ordering Unavailable: No brewers are currently Active (all brewers are On Break or Off).</Text>
        </View>
      ) : !isAdmin && hasActiveOrder ? (
        <View style={s.blockedBoxSoft}>
          <HugeiconsIcon icon={HourglassIcon} size={16} color={colors.midZinc} />
          <Text style={s.blockedTextSoft}>Active Order In Progress: You can order again once your current beverage is delivered.</Text>
        </View>
      ) : !isAdmin && cooldownRemaining > 0 ? (
        <View style={s.blockedBoxSoft}>
          <HugeiconsIcon icon={Clock01Icon} size={16} color={colors.midZinc} />
          <Text style={s.blockedTextSoft}>3-Hour Cooldown: Please wait {formatCooldown(cooldownRemaining)} before placing your next order.</Text>
        </View>
      ) : (
        <Pressable
          disabled={!floor || !drink || !sugar || submitting}
          onPress={handleSubmit}
          style={[s.submitButton, (!floor || !drink || !sugar || submitting) && s.submitButtonDisabled]}
          accessibilityRole="button"
          accessibilityLabel="Place order"
          accessibilityState={{ disabled: !floor || !drink || !sugar || submitting, busy: submitting }}
        >
          <HugeiconsIcon icon={SendingOrderIcon} size={16} color={colors.white} />
          <Text style={s.submitText}>{submitting ? "Placing Order…" : "Place Order"}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = (colors: ColorRamp) =>
  StyleSheet.create({
    card: { borderRadius: 12, borderWidth: 1, borderColor: colors.dividerZinc, backgroundColor: colors.white, padding: 24, gap: 24 },
    section: {},
    sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
    stepBadge: { width: 22, height: 22, borderRadius: 9999, backgroundColor: colors.ink, alignItems: "center", justifyContent: "center" },
    stepBadgeText: { fontSize: 11, fontWeight: "700", color: colors.white },
    sectionTitle: { fontSize: 13, fontWeight: "700", color: colors.ink },
    chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    chipRow2col: { flexDirection: "row", gap: 10 },
    floorChip: { minHeight: 44, justifyContent: "center", borderWidth: 1, borderColor: colors.hairlineZinc, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: colors.white },
    floorChipText: { fontSize: 13, fontWeight: "600", color: colors.slateZinc },
    prefChip: { minHeight: 44, flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderWidth: 1, borderColor: colors.hairlineZinc, borderRadius: 8, paddingVertical: 10, backgroundColor: colors.white },
    prefChipText: { fontSize: 13, fontWeight: "500", color: colors.slateZinc },
    chipActive: { backgroundColor: colors.ink, borderColor: colors.ink },
    chipTextActive: { color: colors.white },
    label: { fontSize: 11, fontWeight: "600", color: colors.quietZinc, marginBottom: 6 },
    drinkGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
    drinkTile: { flexBasis: "48%", flexGrow: 1, height: 100, justifyContent: "center", borderWidth: 2, borderColor: colors.dividerZinc, borderRadius: 12, alignItems: "center", gap: 6, backgroundColor: colors.white },
    drinkTileSelected: { borderColor: colors.ink },
    drinkTileDisabled: { opacity: 0.5, borderColor: colors.surfaceZinc },
    drinkCheck: { position: "absolute", top: -6, right: -6, width: 18, height: 18, borderRadius: 9999, backgroundColor: colors.ink, alignItems: "center", justifyContent: "center" },
    drinkName: { fontSize: 11, fontWeight: "600", color: colors.slateZinc, textAlign: "center" },
    drinkUnavailable: { fontSize: 11, fontWeight: "700", textTransform: "uppercase", color: colors.softZinc },
    noteToggle: { minHeight: 44, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderWidth: 1, borderColor: colors.hairlineZinc, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: colors.white },
    noteToggleText: { fontSize: 13, fontWeight: "500", color: colors.quietZinc },
    noteInput: { marginTop: 8, borderWidth: 1, borderColor: colors.hairlineZinc, borderRadius: 8, padding: 10, fontSize: 13, color: colors.ink, backgroundColor: colors.white, textAlignVertical: "top" },
    summary: { fontSize: 11, fontWeight: "600", color: colors.softZinc },
    submitButton: { minHeight: 44, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: colors.ink, borderRadius: 8, paddingVertical: 14 },
    submitButtonDisabled: { opacity: 0.5 },
    submitText: { fontSize: 13, fontWeight: "700", color: colors.white },
    blockedBoxSoft: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: colors.surfaceZinc, borderWidth: 1, borderColor: colors.dividerZinc, borderRadius: 8, padding: 14 },
    blockedTextSoft: { flex: 1, fontSize: 11, fontWeight: "600", color: colors.midZinc },
  });
