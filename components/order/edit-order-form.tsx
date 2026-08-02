import { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useColors } from "@/constants/use-colors";
import type { ColorRamp } from "@/constants/colors";
import { useRefresh, type Order } from "@/context/RefreshContext";

export function EditOrderForm({
  order,
  onCancel,
  onSave,
}: {
  order: Order;
  onCancel: () => void;
  onSave: (drink: string, sugar: string, floor: string) => Promise<void>;
}) {
  const colors = useColors();
  const s = styles(colors);
  const { beverages, sugarOptions, floors } = useRefresh();
  const [drink, setDrink] = useState(order.drink);
  const [sugar, setSugar] = useState(order.sugar);
  const [floor, setFloor] = useState(order.floor);
  const [saving, setSaving] = useState(false);

  const availableBeverages = beverages.filter((b) => b.enabled || b.name === order.drink);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(drink, sugar, floor);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={s.container}>
      <Text style={s.heading}>Edit Order</Text>

      <Text style={s.label}>Drink</Text>
      <View style={s.chipRow}>
        {availableBeverages.map((b) => (
          <Pressable
            key={b.id}
            onPress={() => setDrink(b.name)}
            style={[s.chip, drink === b.name && s.chipActive]}
            accessibilityRole="button"
            accessibilityLabel={b.name}
            accessibilityState={{ selected: drink === b.name }}
          >
            <Text style={[s.chipText, drink === b.name && s.chipTextActive]}>{b.name}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={s.label}>Sugar</Text>
      <View style={s.chipRow}>
        {sugarOptions.map((opt) => (
          <Pressable
            key={opt}
            onPress={() => setSugar(opt)}
            style={[s.chip, sugar === opt && s.chipActive]}
            accessibilityRole="button"
            accessibilityLabel={opt === "Sugar" ? "With Sugar" : "Sugar-Free"}
            accessibilityState={{ selected: sugar === opt }}
          >
            <Text style={[s.chipText, sugar === opt && s.chipTextActive]}>{opt === "Sugar" ? "With Sugar" : "Sugar-Free"}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={s.label}>Floor</Text>
      <View style={s.chipRow}>
        {floors.map((f) => (
          <Pressable
            key={f}
            onPress={() => setFloor(f)}
            style={[s.chip, floor === f && s.chipActive]}
            accessibilityRole="button"
            accessibilityLabel={`Floor ${f}`}
            accessibilityState={{ selected: floor === f }}
          >
            <Text style={[s.chipText, floor === f && s.chipTextActive]}>{f}</Text>
          </Pressable>
        ))}
      </View>

      <View style={s.actions}>
        <Pressable
          disabled={saving}
          onPress={onCancel}
          style={s.cancelButton}
          accessibilityRole="button"
          accessibilityLabel="Cancel edit"
          accessibilityState={{ disabled: saving }}
        >
          <Text style={s.cancelText}>Cancel</Text>
        </Pressable>
        <Pressable
          disabled={saving}
          onPress={handleSave}
          style={s.saveButton}
          accessibilityRole="button"
          accessibilityLabel="Save order"
          accessibilityState={{ disabled: saving, busy: saving }}
        >
          <Text style={s.saveText}>{saving ? "Saving…" : "Save"}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = (colors: ColorRamp) =>
  StyleSheet.create({
    container: { backgroundColor: colors.surfaceZinc, borderRadius: 8, borderWidth: 1, borderColor: colors.dividerZinc, padding: 12, gap: 8 },
    heading: { fontSize: 12, fontWeight: "700", color: colors.slateZinc },
    label: { fontSize: 11, fontWeight: "700", letterSpacing: 0.6, textTransform: "uppercase", color: colors.quietZinc, marginTop: 4 },
    chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
    chip: { minHeight: 36, justifyContent: "center", borderWidth: 1, borderColor: colors.hairlineZinc, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, backgroundColor: colors.white },
    chipActive: { backgroundColor: colors.ink, borderColor: colors.ink },
    chipText: { fontSize: 11, color: colors.slateZinc },
    chipTextActive: { color: colors.white },
    actions: { flexDirection: "row", justifyContent: "flex-end", gap: 8, marginTop: 4 },
    cancelButton: { minHeight: 40, justifyContent: "center", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, borderWidth: 1, borderColor: colors.hairlineZinc, backgroundColor: colors.white },
    cancelText: { fontSize: 11, fontWeight: "600", color: colors.slateZinc },
    saveButton: { minHeight: 40, justifyContent: "center", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, backgroundColor: colors.ink },
    saveText: { fontSize: 11, fontWeight: "600", color: colors.white },
  });
