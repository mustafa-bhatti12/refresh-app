import { useState } from "react";
import { View, Text, Pressable, Alert, StyleSheet } from "react-native";
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
      <Text style={s.title}>Employees</Text>
      <Text style={s.subtitle}>Employees get access automatically the first time they sign in with Google — no need to add them here.</Text>
      {employees.length === 0 ? (
        <Text style={s.emptyText}>No employees yet.</Text>
      ) : (
        employees.map((emp, idx) => (
          <View key={emp.id} style={[s.row, idx === employees.length - 1 && { borderBottomWidth: 0 }]}>
            <View style={{ flex: 1 }}>
              <Text style={s.name}>{emp.name}</Text>
              <Text style={s.contact}>{emp.contact}</Text>
            </View>
            <Pressable disabled={deletingId === emp.id} onPress={() => handleDelete(emp)}>
              <Text style={s.deleteText}>{deletingId === emp.id ? "Removing…" : "Delete"}</Text>
            </Pressable>
          </View>
        ))
      )}
    </View>
  );
}

const styles = (colors: ColorRamp) =>
  StyleSheet.create({
    card: { borderRadius: 12, borderWidth: 1, borderColor: colors.dividerZinc, backgroundColor: colors.white, padding: 20 },
    title: { fontSize: 15, fontWeight: "700", color: colors.ink },
    subtitle: { fontSize: 11, color: colors.softZinc, marginTop: 4, marginBottom: 12 },
    emptyText: { fontSize: 12, color: colors.softZinc, textAlign: "center", paddingVertical: 16 },
    row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.dividerZinc },
    name: { fontSize: 13, fontWeight: "600", color: colors.ink },
    contact: { fontSize: 11, color: colors.softZinc, marginTop: 1 },
    deleteText: { fontSize: 11, fontWeight: "700", color: colors.quietZinc },
  });
