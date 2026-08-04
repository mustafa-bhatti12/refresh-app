import { useEffect, useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, Platform, useColorScheme } from "react-native";
import Animated, {
  FadeInDown,
  FadeIn,
  FadeOut,
  ZoomIn,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolateColor,
} from "react-native-reanimated";
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

// Shared press-bounce physics for chips/tiles/buttons — the RN analogue of the
// web's whileHover/whileTap spring, since Pressable has no built-in animation.
function usePressScale() {
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const onPressIn = () => {
    scale.value = withSpring(0.96, { damping: 16, stiffness: 320 });
  };
  const onPressOut = () => {
    scale.value = withSpring(1, { damping: 14, stiffness: 260 });
  };
  return { style, onPressIn, onPressOut };
}

function FloorChip({ label, selected, onPress, colors, s }: { label: string; selected: boolean; onPress: () => void; colors: ColorRamp; s: ReturnType<typeof styles> }) {
  const { style: pressStyle, onPressIn, onPressOut } = usePressScale();
  const t = useSharedValue(selected ? 1 : 0);
  useEffect(() => {
    t.value = withTiming(selected ? 1 : 0, { duration: 200 });
  }, [selected, t]);
  const chipStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(t.value, [0, 1], [colors.white, colors.ink]),
    borderColor: interpolateColor(t.value, [0, 1], [colors.hairlineZinc, colors.ink]),
  }));
  const textStyle = useAnimatedStyle(() => ({
    color: interpolateColor(t.value, [0, 1], [colors.slateZinc, colors.white]),
  }));
  return (
    <Pressable onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut} accessibilityRole="button" accessibilityLabel={`Floor ${label}`} accessibilityState={{ selected }}>
      <Animated.View style={[s.floorChip, pressStyle, chipStyle]}>
        <Animated.Text style={[s.floorChipText, textStyle]}>{label}</Animated.Text>
      </Animated.View>
    </Pressable>
  );
}

function PrefChip({ label, icon, selected, onPress, colors, s }: { label: string; icon: unknown; selected: boolean; onPress: () => void; colors: ColorRamp; s: ReturnType<typeof styles> }) {
  const { style: pressStyle, onPressIn, onPressOut } = usePressScale();
  const t = useSharedValue(selected ? 1 : 0);
  useEffect(() => {
    t.value = withTiming(selected ? 1 : 0, { duration: 200 });
  }, [selected, t]);
  const chipStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(t.value, [0, 1], [colors.white, colors.ink]),
    borderColor: interpolateColor(t.value, [0, 1], [colors.hairlineZinc, colors.ink]),
  }));
  const textStyle = useAnimatedStyle(() => ({
    color: interpolateColor(t.value, [0, 1], [colors.slateZinc, colors.white]),
  }));
  return (
    <Pressable onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut} style={{ flex: 1 }} accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ selected }}>
      <Animated.View style={[s.prefChip, pressStyle, chipStyle]}>
        {/* Icon tint switches instantly rather than animating — HugeiconsIcon's
            color prop isn't a Reanimated shared value target, and a one-frame
            snap here is unnoticeable next to the chip's color sweep. */}
        <HugeiconsIcon icon={icon as never} size={15} color={selected ? colors.white : colors.slateZinc} />
        <Animated.Text style={[s.prefChipText, textStyle]}>{label}</Animated.Text>
      </Animated.View>
    </Pressable>
  );
}

function DrinkTile({
  name,
  icon,
  enabled,
  selected,
  onPress,
  colors,
  s,
}: {
  name: string;
  icon: unknown;
  enabled: boolean;
  selected: boolean;
  onPress: () => void;
  colors: ColorRamp;
  s: ReturnType<typeof styles>;
}) {
  const { style: pressStyle, onPressIn, onPressOut } = usePressScale();
  const t = useSharedValue(selected ? 1 : 0);
  useEffect(() => {
    t.value = withTiming(selected ? 1 : 0, { duration: 200 });
  }, [selected, t]);
  const tileStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(t.value, [0, 1], [colors.dividerZinc, colors.ink]),
  }));

  return (
    <Pressable
      disabled={!enabled}
      onPress={onPress}
      onPressIn={enabled ? onPressIn : undefined}
      onPressOut={enabled ? onPressOut : undefined}
      style={s.drinkTileWrap}
      accessibilityRole="button"
      accessibilityLabel={enabled ? name : `${name}, unavailable`}
      accessibilityState={{ selected: selected && enabled, disabled: !enabled }}
    >
      <Animated.View
        style={[
          s.drinkTile,
          !enabled && s.drinkTileDisabled,
          enabled && tileStyle,
          enabled && pressStyle,
          selected && enabled && s.drinkTileGlow,
        ]}
      >
        {selected && enabled && (
          <Animated.View entering={ZoomIn.duration(160)} style={s.drinkCheck}>
            <HugeiconsIcon icon={CheckmarkCircle02Icon} size={12} color={colors.white} />
          </Animated.View>
        )}
        <HugeiconsIcon icon={icon as never} size={26} color={colors.ink} />
        <Text style={s.drinkName} numberOfLines={1}>{name}</Text>
        {!enabled && <Text style={s.drinkUnavailable}>Unavailable</Text>}
      </Animated.View>
    </Pressable>
  );
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
  const scheme = useColorScheme();
  const s = styles(colors);
  const { floors, beverages, sugarOptions, strengthOptions, currentUser } = useRefresh();

  const [floor, setFloor] = useState(currentUser?.floor || floors[0] || "");
  const [drink, setDrink] = useState(beverages.find((b) => b.enabled)?.name || "");
  const [sugar, setSugar] = useState(sugarOptions[0] || "");
  const [note, setNote] = useState("");
  const [showNote, setShowNote] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { style: submitPressStyle, onPressIn: onSubmitPressIn, onPressOut: onSubmitPressOut } = usePressScale();

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
      <Animated.View entering={FadeInDown.duration(400).delay(0)} style={s.section}>
        <View style={s.sectionHeader}>
          <View style={[s.stepBadge, scheme === "dark" && { backgroundColor: colors.copper }]}>
            <Text style={[s.stepBadgeText, scheme === "dark" && { color: colors.black }]}>01</Text>
          </View>
          <Text style={s.sectionTitle}>Where should we deliver it?</Text>
        </View>
        <View style={s.chipRow}>
          {floors.map((f) => (
            <FloorChip key={f} label={f} selected={floor === f} onPress={() => setFloor(f)} colors={colors} s={s} />
          ))}
        </View>
      </Animated.View>

      {/* 02 Drink */}
      <Animated.View entering={FadeInDown.duration(400).delay(70)} style={s.section}>
        <View style={s.sectionHeader}>
          <View style={[s.stepBadge, scheme === "dark" && { backgroundColor: colors.copper }]}>
            <Text style={[s.stepBadgeText, scheme === "dark" && { color: colors.black }]}>02</Text>
          </View>
          <Text style={s.sectionTitle}>What would you like?</Text>
        </View>
        <View style={s.drinkGrid}>
          {beverages.map((bev) => (
            <DrinkTile
              key={bev.id}
              name={bev.name}
              icon={getBeverageIcon(bev.icon)}
              enabled={bev.enabled}
              selected={drink === bev.name}
              onPress={() => setDrink(bev.name)}
              colors={colors}
              s={s}
            />
          ))}
        </View>
      </Animated.View>

      {/* 03 Preferences */}
      <Animated.View entering={FadeInDown.duration(400).delay(140)} style={s.section}>
        <View style={s.sectionHeader}>
          <View style={[s.stepBadge, scheme === "dark" && { backgroundColor: colors.copper }]}>
            <Text style={[s.stepBadgeText, scheme === "dark" && { color: colors.black }]}>03</Text>
          </View>
          <Text style={s.sectionTitle}>Preferences</Text>
        </View>
        <Text style={s.label}>Sugar</Text>
        <View style={s.chipRow2col}>
          {sugarOptions.map((opt) => (
            <PrefChip
              key={opt}
              label={opt === "Sugar" ? "With Sugar" : "Sugar-Free"}
              icon={opt === "Sugar" ? CheckmarkCircle01Icon : Cancel01Icon}
              selected={sugar === opt}
              onPress={() => setSugar(opt)}
              colors={colors}
              s={s}
            />
          ))}
        </View>
      </Animated.View>

      {/* 04 Note */}
      <Animated.View entering={FadeInDown.duration(400).delay(210)} style={s.section}>
        <View style={s.sectionHeader}>
          <View style={[s.stepBadge, scheme === "dark" && { backgroundColor: colors.copper }]}>
            <Text style={[s.stepBadgeText, scheme === "dark" && { color: colors.black }]}>04</Text>
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
          <Animated.View entering={FadeInDown.duration(200)} exiting={FadeOut.duration(150)}>
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
          </Animated.View>
        )}
      </Animated.View>

      {floor && drink && sugar && (
        <Animated.Text key={`${floor}-${drink}-${sugar}`} entering={FadeIn.duration(180)} exiting={FadeOut.duration(120)} style={s.summary}>
          {floor} · {drink} · {sugar === "Sugar" ? "With Sugar" : "Sugar-Free"}
        </Animated.Text>
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
          onPressIn={onSubmitPressIn}
          onPressOut={onSubmitPressOut}
          accessibilityRole="button"
          accessibilityLabel="Place order"
          accessibilityState={{ disabled: !floor || !drink || !sugar || submitting, busy: submitting }}
        >
          <Animated.View
            style={[
              s.submitButton,
              s.submitGlow,
              submitPressStyle,
              (!floor || !drink || !sugar || submitting) && s.submitButtonDisabled,
            ]}
          >
            <HugeiconsIcon icon={SendingOrderIcon} size={16} color={colors.white} />
            <Text style={s.submitText}>{submitting ? "Placing Order…" : "Place Order"}</Text>
          </Animated.View>
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
    prefChip: { minHeight: 44, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderWidth: 1, borderColor: colors.hairlineZinc, borderRadius: 8, paddingVertical: 10, backgroundColor: colors.white },
    prefChipText: { fontSize: 13, fontWeight: "500", color: colors.slateZinc },
    label: { fontSize: 11, fontWeight: "600", color: colors.quietZinc, marginBottom: 6 },
    drinkGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
    drinkTileWrap: { flexBasis: "48%", flexGrow: 1 },
    drinkTile: { height: 100, justifyContent: "center", borderWidth: 2, borderColor: colors.dividerZinc, borderRadius: 12, alignItems: "center", gap: 6, backgroundColor: colors.white },
    drinkTileDisabled: { opacity: 0.5, borderColor: colors.surfaceZinc },
    // iOS only: Android's elevation shadow can't be tinted, so the copper glow
    // quietly degrades to "no glow" there rather than faking it with a colored view.
    drinkTileGlow: Platform.select({
      ios: { shadowColor: colors.copper, shadowOpacity: colors.copperShadowOpacity, shadowRadius: 14, shadowOffset: { width: 0, height: 6 } },
      default: {},
    }) as object,
    drinkCheck: { position: "absolute", top: -6, right: -6, width: 18, height: 18, borderRadius: 9999, backgroundColor: colors.ink, alignItems: "center", justifyContent: "center" },
    drinkName: { fontSize: 11, fontWeight: "600", color: colors.slateZinc, textAlign: "center" },
    drinkUnavailable: { fontSize: 11, fontWeight: "700", textTransform: "uppercase", color: colors.softZinc },
    noteToggle: { minHeight: 44, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderWidth: 1, borderColor: colors.hairlineZinc, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: colors.white },
    noteToggleText: { fontSize: 13, fontWeight: "500", color: colors.quietZinc },
    noteInput: { marginTop: 8, borderWidth: 1, borderColor: colors.hairlineZinc, borderRadius: 8, padding: 10, fontSize: 13, color: colors.ink, backgroundColor: colors.white, textAlignVertical: "top" },
    summary: { fontSize: 11, fontWeight: "600", color: colors.softZinc },
    submitButton: { minHeight: 44, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: colors.ink, borderRadius: 8, paddingVertical: 14 },
    submitGlow: Platform.select({
      ios: { shadowColor: colors.copper, shadowOpacity: colors.copperShadowOpacity, shadowRadius: 16, shadowOffset: { width: 0, height: 8 } },
      default: {},
    }) as object,
    submitButtonDisabled: { opacity: 0.5 },
    submitText: { fontSize: 13, fontWeight: "700", color: colors.white },
    blockedBoxSoft: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: colors.surfaceZinc, borderWidth: 1, borderColor: colors.dividerZinc, borderRadius: 8, padding: 14 },
    blockedTextSoft: { flex: 1, fontSize: 11, fontWeight: "600", color: colors.midZinc },
  });
