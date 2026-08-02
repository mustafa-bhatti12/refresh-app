import { useState } from "react";
import { View, Text, TextInput, Pressable, Switch, Alert, StyleSheet } from "react-native";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { Add01Icon, Delete02Icon } from "@hugeicons/core-free-icons";
import { useColors } from "@/constants/use-colors";
import type { ColorRamp } from "@/constants/colors";
import type { Beverage } from "@/context/RefreshContext";
import { BEVERAGE_ICON_NAMES, getBeverageIcon } from "@/lib/beverage-icons";

export function BeveragePanel({
  beverages,
  onAdd,
  onToggle,
  onDelete,
}: {
  beverages: Beverage[];
  onAdd: (name: string, icon: string) => Promise<void>;
  onToggle: (id: string, enabled: boolean) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const colors = useColors();
  const s = styles(colors);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState(BEVERAGE_ICON_NAMES[0]);
  const [adding, setAdding] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleAdd = async () => {
    if (!name.trim()) return;
    setAdding(true);
    try {
      await onAdd(name, icon);
      setName("");
      setIcon(BEVERAGE_ICON_NAMES[0]);
    } catch (err) {
      Alert.alert("Couldn't add beverage", err instanceof Error ? err.message : "Try again.");
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = (bev: Beverage) => {
    Alert.alert("Delete beverage?", `Remove ${bev.name} from the catalog?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          setDeletingId(bev.id);
          try {
            await onDelete(bev.id);
          } finally {
            setDeletingId(null);
          }
        },
      },
    ]);
  };

  return (
    <View style={s.card}>
      <Text style={s.title}>Beverage Catalog</Text>
      <Text style={s.subtitle}>Disabled beverages show greyed out on the employee order form.</Text>

      {beverages.length === 0 ? (
        <Text style={s.emptyText}>No beverages configured yet.</Text>
      ) : (
        beverages.map((bev, idx) => {
          const BevIcon = getBeverageIcon(bev.icon);
          return (
            <View key={bev.id} style={[s.row, idx === beverages.length - 1 && { borderBottomWidth: 0 }]}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}>
                <View style={[s.iconBox, !bev.enabled && s.iconBoxDisabled]}>
                  <HugeiconsIcon icon={BevIcon} size={18} color={bev.enabled ? colors.ink : colors.softZinc} />
                </View>
                <Text style={[s.name, !bev.enabled && s.nameDisabled]}>{bev.name}</Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <Switch
                  disabled={togglingId === bev.id}
                  value={bev.enabled}
                  onValueChange={async () => {
                    setTogglingId(bev.id);
                    try {
                      await onToggle(bev.id, !bev.enabled);
                    } finally {
                      setTogglingId(null);
                    }
                  }}
                  trackColor={{ false: colors.dividerZinc, true: colors.ink }}
                  thumbColor={colors.white}
                  accessibilityRole="switch"
                  accessibilityLabel={`${bev.name} enabled`}
                  accessibilityState={{ checked: bev.enabled, disabled: togglingId === bev.id }}
                />
                <Pressable
                  disabled={deletingId === bev.id}
                  onPress={() => handleDelete(bev)}
                  style={s.deleteButton}
                  accessibilityRole="button"
                  accessibilityLabel={`Delete ${bev.name}`}
                  accessibilityState={{ disabled: deletingId === bev.id, busy: deletingId === bev.id }}
                  hitSlop={8}
                >
                  <HugeiconsIcon icon={Delete02Icon} size={16} color={colors.softZinc} />
                </Pressable>
              </View>
            </View>
          );
        })
      )}

      <View style={s.addForm}>
        <TextInput
          style={s.input}
          value={name}
          onChangeText={setName}
          placeholder="Beverage name (e.g. Hot Chocolate)"
          placeholderTextColor={colors.softZinc}
          accessibilityLabel="Beverage name"
        />
        <Text style={s.fieldLabel}>Icon</Text>
        <View style={s.iconGrid}>
          {BEVERAGE_ICON_NAMES.map((iconName) => {
            const OptIcon = getBeverageIcon(iconName);
            const selected = icon === iconName;
            return (
              <Pressable
                key={iconName}
                onPress={() => setIcon(iconName)}
                style={[s.iconOption, selected && s.iconOptionSelected]}
                accessibilityRole="button"
                accessibilityLabel={`Icon ${iconName}`}
                accessibilityState={{ selected }}
              >
                <HugeiconsIcon icon={OptIcon} size={16} color={selected ? colors.white : colors.slateZinc} />
              </Pressable>
            );
          })}
        </View>
        <Pressable
          disabled={adding}
          onPress={handleAdd}
          style={s.addButton}
          accessibilityRole="button"
          accessibilityLabel="Add beverage"
          accessibilityState={{ disabled: adding, busy: adding }}
        >
          <HugeiconsIcon icon={Add01Icon} size={14} color={colors.white} />
          <Text style={s.addButtonText}>{adding ? "Adding…" : "Add Beverage"}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = (colors: ColorRamp) =>
  StyleSheet.create({
    card: { borderRadius: 12, borderWidth: 1, borderColor: colors.dividerZinc, backgroundColor: colors.white, padding: 20 },
    title: { fontSize: 15, fontWeight: "700", color: colors.ink },
    subtitle: { fontSize: 11, color: colors.softZinc, marginTop: 4, marginBottom: 12 },
    emptyText: { fontSize: 12, color: colors.softZinc, textAlign: "center", paddingVertical: 16 },
    row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.dividerZinc },
    iconBox: { width: 32, height: 32, borderRadius: 8, borderWidth: 1, borderColor: colors.dividerZinc, alignItems: "center", justifyContent: "center", backgroundColor: colors.white },
    iconBoxDisabled: { borderColor: colors.surfaceZinc, backgroundColor: colors.surfaceZinc },
    name: { fontSize: 13, fontWeight: "600", color: colors.slateZinc, flexShrink: 1 },
    nameDisabled: { color: colors.softZinc },
    deleteButton: { minWidth: 44, minHeight: 44, alignItems: "center", justifyContent: "center" },
    addForm: { marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: colors.dividerZinc, gap: 8 },
    input: { borderWidth: 1, borderColor: colors.hairlineZinc, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, fontSize: 12, color: colors.ink, backgroundColor: colors.white },
    fieldLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 0.5, textTransform: "uppercase", color: colors.softZinc },
    iconGrid: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
    iconOption: { width: 44, height: 44, borderRadius: 8, borderWidth: 1, borderColor: colors.dividerZinc, alignItems: "center", justifyContent: "center", backgroundColor: colors.white },
    iconOptionSelected: { backgroundColor: colors.ink, borderColor: colors.ink },
    addButton: { minHeight: 44, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: colors.ink, borderRadius: 8, paddingVertical: 10 },
    addButtonText: { color: colors.white, fontSize: 12, fontWeight: "700" },
  });
