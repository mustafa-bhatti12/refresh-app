import { useState } from "react";
import { View, Text, TextInput, Pressable, Modal, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  CheckmarkCircle02Icon,
  CheckmarkCircle01Icon,
  Sad02Icon,
  UnhappyIcon,
  SmileIcon,
  Happy01Icon,
  SmileDizzyIcon,
} from "@hugeicons/core-free-icons";
import { useColors } from "@/constants/use-colors";
import type { ColorRamp } from "@/constants/colors";
import type { Order } from "@/context/RefreshContext";

const REACTIONS = [
  { value: 1, icon: Sad02Icon, label: "Poor" },
  { value: 2, icon: UnhappyIcon, label: "OK" },
  { value: 3, icon: SmileIcon, label: "Good" },
  { value: 4, icon: Happy01Icon, label: "Delicious" },
  { value: 5, icon: SmileDizzyIcon, label: "Amazing!" },
];

export function ReviewModal({
  order,
  dailyNumber,
  mandatory,
  onSubmit,
  onCancel,
}: {
  order: Order;
  dailyNumber: string;
  mandatory: boolean;
  onSubmit: (rating: number, comments: string) => void;
  onCancel: () => void;
}) {
  const colors = useColors();
  const s = styles(colors);
  const [rating, setRating] = useState(5);
  const [comments, setComments] = useState("");

  return (
    <Modal visible transparent animationType="fade">
      <KeyboardAvoidingView
        style={s.overlay}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={s.card}>
          <View style={{ alignItems: "center" }}>
            <HugeiconsIcon icon={CheckmarkCircle02Icon} size={40} color={colors.ink} />
            {dailyNumber ? <Text style={s.dailyNumber}>{dailyNumber}</Text> : null}
            <Text style={s.title}>{mandatory ? "Confirm Delivery & Rate" : "Leave Feedback for Order"}</Text>
            <Text style={s.subtitle}>
              {`Your order of ${order.drink} (${order.sugar}) has been delivered! Please rate it to confirm delivery.`}
            </Text>
          </View>

          <Text style={s.label}>How was it?</Text>
          <View style={s.reactionRow}>
            {REACTIONS.map((r) => {
              const selected = rating === r.value;
              return (
                <Pressable
                  key={r.value}
                  onPress={() => setRating(r.value)}
                  style={[s.reactionChip, selected && s.reactionChipActive]}
                  accessibilityRole="button"
                  accessibilityLabel={r.label}
                  accessibilityState={{ selected }}
                >
                  <HugeiconsIcon icon={r.icon} size={22} color={selected ? colors.white : colors.slateZinc} />
                  <Text style={[s.reactionLabel, { color: selected ? colors.white : colors.slateZinc }]}>{r.label}</Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={s.label}>Review comments (optional)</Text>
          <TextInput
            style={s.textArea}
            value={comments}
            onChangeText={setComments}
            multiline
            numberOfLines={3}
            placeholder="e.g. Perfectly brewed! Thank you!"
            placeholderTextColor={colors.softZinc}
            accessibilityLabel="Review comments"
          />

          <View style={s.actions}>
            {!mandatory && (
              <Pressable style={s.cancelButton} onPress={onCancel} accessibilityRole="button" accessibilityLabel="Cancel">
                <Text style={s.cancelText}>Cancel</Text>
              </Pressable>
            )}
            <Pressable style={s.submitButton} onPress={() => onSubmit(rating, comments)} accessibilityRole="button" accessibilityLabel="Confirm and submit review">
              <HugeiconsIcon icon={CheckmarkCircle01Icon} size={14} color={colors.white} />
              <Text style={s.submitText}>Confirm & Submit Review</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = (colors: ColorRamp) =>
  StyleSheet.create({
    overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", alignItems: "center", justifyContent: "center", padding: 16 },
    card: { width: "100%", maxWidth: 420, borderRadius: 16, backgroundColor: colors.white, padding: 24, gap: 12 },
    dailyNumber: { fontSize: 34, fontWeight: "800", color: colors.ink, marginTop: 12 },
    title: { fontSize: 18, fontWeight: "700", color: colors.ink, marginTop: 4 },
    subtitle: { fontSize: 12, color: colors.quietZinc, marginTop: 6, textAlign: "center" },
    label: { fontSize: 11, fontWeight: "700", letterSpacing: 0.9, textTransform: "uppercase", color: colors.quietZinc, marginTop: 8 },
    reactionRow: { flexDirection: "row", gap: 8, marginTop: 8 },
    reactionChip: { flex: 1, minHeight: 44, alignItems: "center", justifyContent: "center", padding: 8, borderRadius: 12, borderWidth: 1, borderColor: colors.hairlineZinc, backgroundColor: colors.white },
    reactionChipActive: { backgroundColor: colors.ink, borderColor: colors.ink },
    reactionLabel: { fontSize: 11, fontWeight: "700", marginTop: 4 },
    textArea: { marginTop: 6, borderWidth: 1, borderColor: colors.hairlineZinc, borderRadius: 8, padding: 10, fontSize: 13, color: colors.ink, backgroundColor: colors.white, textAlignVertical: "top" },
    actions: { flexDirection: "row", justifyContent: "flex-end", gap: 10, marginTop: 12 },
    cancelButton: { minHeight: 44, justifyContent: "center", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: colors.hairlineZinc, backgroundColor: colors.white },
    cancelText: { fontSize: 12, fontWeight: "700", color: colors.slateZinc },
    submitButton: { minHeight: 44, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: colors.ink },
    submitText: { fontSize: 12, fontWeight: "700", color: colors.white },
  });
