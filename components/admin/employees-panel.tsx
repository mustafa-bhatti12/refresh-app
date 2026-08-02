import { useState } from "react";
import { View, Text, Pressable, Alert, StyleSheet, FlatList } from "react-native";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { ArrowDown01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { useColors } from "@/constants/use-colors";
import type { ColorRamp } from "@/constants/colors";
import type { EmployeeItem } from "@/context/RefreshContext";

export function EmployeesPanel({
  employees,
  onDelete,
}: {
  employees: EmployeeItem[];
  onDelete: (id: string) => Promise<void>;
}) {
  const colors = useColors();
  const s = styles(colors);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const handleDelete = (emp: EmployeeItem) => {
    Alert.alert("Remove employee?", `Remove ${emp.name} from the employee list?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          setDeletingId(emp.id);
          try {
            await onDelete(emp.id);
          } finally {
            setDeletingId(null);
          }
        },
      },
    ]);
  };

  return (
    <View style={s.card}>
      <Pressable
        style={s.headerRow}
        onPress={() => setOpen((v) => !v)}
        accessibilityRole="button"
        accessibilityLabel="Employees"
        accessibilityState={{ expanded: open }}
      >
        <View style={{ flex: 1 }}>
          <Text style={s.title}>Employees</Text>
          <Text style={s.headerMeta}>{employees.length} employee{employees.length !== 1 ? "s" : ""}</Text>
        </View>
        <HugeiconsIcon icon={open ? ArrowDown01Icon : ArrowRight01Icon} size={16} color={colors.softZinc} />
      </Pressable>
      {open && (
        <View style={s.body}>
          <Text style={s.subtitle}>Employees get access automatically the first time they sign in with Google — no need to add them here.</Text>
          {employees.length === 0 ? (
            <Text style={s.emptyText}>No employees yet.</Text>
          ) : (
            <FlatList
              data={employees}
              keyExtractor={(emp) => emp.id}
              scrollEnabled={false}
              renderItem={({ item: emp, index }) => (
                <View style={[s.row, index === employees.length - 1 && { borderBottomWidth: 0 }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.name}>{emp.name}</Text>
                    <Text style={s.contact}>{emp.contact}</Text>
                  </View>
                  <Pressable
                    disabled={deletingId === emp.id}
                    onPress={() => handleDelete(emp)}
                    style={s.smallTapTarget}
                    accessibilityRole="button"
                    accessibilityLabel={`Delete ${emp.name}`}
                    accessibilityState={{ disabled: deletingId === emp.id, busy: deletingId === emp.id }}
                    hitSlop={8}
                  >
                    <Text style={s.deleteText}>{deletingId === emp.id ? "Removing…" : "Delete"}</Text>
                  </Pressable>
                </View>
              )}
            />
          )}
        </View>
      )}
    </View>
  );
}

const styles = (colors: ColorRamp) =>
  StyleSheet.create({
    card: { borderRadius: 12, borderWidth: 1, borderColor: colors.dividerZinc, backgroundColor: colors.white, padding: 20 },
    headerRow: { minHeight: 44, flexDirection: "row", alignItems: "center", gap: 10 },
    smallTapTarget: { minHeight: 44, minWidth: 44, alignItems: "center", justifyContent: "center" },
    title: { fontSize: 15, fontWeight: "700", color: colors.ink },
    headerMeta: { fontSize: 11, color: colors.softZinc, marginTop: 2 },
    body: { marginTop: 12 },
    subtitle: { fontSize: 11, color: colors.softZinc, marginBottom: 12 },
    emptyText: { fontSize: 12, color: colors.softZinc, textAlign: "center", paddingVertical: 16 },
    row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.dividerZinc },
    name: { fontSize: 13, fontWeight: "600", color: colors.ink },
    contact: { fontSize: 11, color: colors.softZinc, marginTop: 1 },
    deleteText: { fontSize: 11, fontWeight: "700", color: colors.quietZinc },
  });
