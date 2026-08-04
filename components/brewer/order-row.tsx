import { View, Text, Pressable, StyleSheet } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  FadeInDown,
  FadeOutRight,
  LinearTransition,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  Extrapolation,
  runOnJS,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { Location01Icon, Note01Icon, CancelCircleIcon, UserIcon } from "@hugeicons/core-free-icons";
import { useColors } from "@/constants/use-colors";
import type { ColorRamp } from "@/constants/colors";
import type { Order } from "@/context/RefreshContext";

const NEXT_LABEL: Record<string, string> = {
  Pending: "Start Preparing",
  Ready: "Mark Delivered",
};

// Swipe left past this to trigger the cancel dialog; clamped so the drag can't run away.
const SWIPE_TRIGGER = -76;
const SWIPE_MAX = -110;

export function OrderRow({
  order,
  dailyNumber,
  isActioning,
  onPrimaryAction,
  onCancel,
  isLast,
}: {
  order: Order;
  dailyNumber: string;
  isActioning: boolean;
  onPrimaryAction: () => void;
  onCancel: () => void;
  isLast?: boolean;
}) {
  const colors = useColors();
  const s = styles(colors);
  const nextLabel = NEXT_LABEL[order.status];

  const translateX = useSharedValue(0);
  const triggerCancel = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    onCancel();
  };

  const pan = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .failOffsetY([-10, 10])
    .onUpdate((e) => {
      translateX.value = Math.max(SWIPE_MAX, Math.min(0, e.translationX));
    })
    .onEnd(() => {
      if (translateX.value < SWIPE_TRIGGER) runOnJS(triggerCancel)();
      translateX.value = withSpring(0, { damping: 20, stiffness: 300 });
    });

  const rowStyle = useAnimatedStyle(() => ({ transform: [{ translateX: translateX.value }] }));
  const hintStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, SWIPE_TRIGGER], [0, 1], Extrapolation.CLAMP),
  }));

  return (
    <View style={{ overflow: "hidden" }}>
      <Animated.View style={[s.cancelHint, hintStyle]} pointerEvents="none">
        <HugeiconsIcon icon={CancelCircleIcon} size={14} color={colors.white} />
        <Text style={s.cancelHintText}>Not Found</Text>
      </Animated.View>
      <GestureDetector gesture={pan}>
        <Animated.View
          entering={FadeInDown.duration(280)}
          exiting={FadeOutRight.duration(220)}
          layout={LinearTransition.duration(220)}
          style={[s.row, isLast && s.rowLast, rowStyle]}
        >
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={s.title}>
              <Text style={s.dailyNumber}>{dailyNumber}</Text> {order.drink} <Text style={s.meta}>({order.sugar}{order.strength ? `, ${order.strength}` : ""})</Text>
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 3 }}>
              <HugeiconsIcon icon={UserIcon} size={12} color={colors.quietZinc} />
              <Text style={s.employeeName}>{order.employeeName}</Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 3 }}>
              <HugeiconsIcon icon={Location01Icon} size={12} color={colors.quietZinc} />
              <Text style={s.meta}>{order.floor}</Text>
              <Text style={s.meta}>· {new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</Text>
            </View>
            {order.note && (
              <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 4, marginTop: 4 }}>
                <HugeiconsIcon icon={Note01Icon} size={12} color={colors.softZinc} />
                <Text style={s.note}>{order.note}</Text>
              </View>
            )}
          </View>

          {nextLabel && (
            <Pressable
              disabled={isActioning}
              onPress={onPrimaryAction}
              style={[s.actionButton, isActioning && s.actionButtonDisabled]}
              accessibilityRole="button"
              accessibilityLabel={nextLabel}
              accessibilityState={{ disabled: isActioning, busy: isActioning }}
              hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
            >
              <Text style={s.actionButtonText}>{isActioning ? "…" : nextLabel}</Text>
            </Pressable>
          )}
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = (colors: ColorRamp) =>
  StyleSheet.create({
    row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12, paddingVertical: 10, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.dividerZinc },
    rowLast: { borderBottomWidth: 0 },
    title: { fontSize: 13, fontWeight: "600", color: colors.ink },
    dailyNumber: { fontWeight: "800" },
    meta: { fontSize: 11, color: colors.quietZinc },
    note: { flex: 1, fontSize: 11, color: colors.softZinc, fontStyle: "italic" },
    employeeName: { fontSize: 12, fontWeight: "600", color: colors.slateZinc },
    actionButton: { justifyContent: "center", backgroundColor: colors.ink, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
    actionButtonDisabled: { opacity: 0.6 },
    actionButtonText: { color: colors.white, fontSize: 11, fontWeight: "700" },
    cancelHint: {
      position: "absolute",
      top: 0,
      bottom: 0,
      right: 0,
      width: 110,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 5,
      backgroundColor: colors.ink,
    },
    cancelHintText: { fontSize: 11, fontWeight: "700", color: colors.white },
  });
