import { useEffect, useState } from "react";
import { View, Text, TextInput, Pressable, Switch, Platform, StyleSheet } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { Clock01Icon, ArrowDown01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { useColors } from "@/constants/use-colors";
import type { ColorRamp } from "@/constants/colors";

const DAY_LABELS = [
  { value: 0, label: "Sun" },
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
];

function toggleDay(days: number[], day: number) {
  return days.includes(day) ? days.filter((d) => d !== day) : [...days, day].sort();
}

function formatDays(days: number[]) {
  if (days.length === 7) return "Every day";
  return DAY_LABELS.filter((d) => days.includes(d.value)).map((d) => d.label).join(", ");
}

function timeToDate(time: string) {
  const [h, m] = time.split(":").map(Number);
  const d = new Date();
  d.setHours(h || 0, m || 0, 0, 0);
  return d;
}

function dateToTime(date: Date) {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function TimeField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const colors = useColors();
  const s = styles(colors);
  const [showPicker, setShowPicker] = useState(false);

  return (
    <View style={{ flex: 1 }}>
      <Text style={s.fieldLabel}>{label}</Text>
      <Pressable
        onPress={() => setShowPicker(true)}
        style={s.timeButton}
        accessibilityRole="button"
        accessibilityLabel={`${label} time, ${value || "not set"}`}
      >
        <Text style={s.timeButtonText}>{value || "--:--"}</Text>
      </Pressable>
      {showPicker && (
        <DateTimePicker
          value={timeToDate(value || "09:00")}
          mode="time"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={(_, selected) => {
            setShowPicker(Platform.OS === "ios");
            if (selected) onChange(dateToTime(selected));
          }}
        />
      )}
    </View>
  );
}

function DayPicker({ days, onToggle }: { days: number[]; onToggle: (day: number) => void }) {
  const colors = useColors();
  const s = styles(colors);
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 5 }}>
      {DAY_LABELS.map((day) => {
        const active = days.includes(day.value);
        return (
          <Pressable
            key={day.value}
            onPress={() => onToggle(day.value)}
            style={[s.dayChip, active && s.dayChipActive]}
            accessibilityRole="button"
            accessibilityLabel={day.label}
            accessibilityState={{ selected: active }}
          >
            <Text style={[s.dayChipText, active && s.dayChipTextActive]}>{day.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

type ServiceHour = { id: string; label: string; start_time: string; end_time: string; days_of_week: number[]; brewer_id: string };
type Brewer = { id: string; name: string };

export function ServiceHoursPanel({
  brewers,
  serviceHours,
  cooldownLimitEnabled,
  onAdd,
  onUpdate,
  onDelete,
  onToggleCooldown,
}: {
  brewers: Brewer[];
  serviceHours: ServiceHour[];
  cooldownLimitEnabled: boolean;
  onAdd: (brewerId: string, label: string, start: string, end: string, days: number[]) => Promise<void>;
  onUpdate: (id: string, brewerId: string, label: string, start: string, end: string, days: number[]) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onToggleCooldown: (enabled: boolean) => Promise<void>;
}) {
  const colors = useColors();
  const s = styles(colors);
  const [open, setOpen] = useState(false);
  const [selectedBrewerId, setSelectedBrewerId] = useState(brewers[0]?.id ?? "");

  useEffect(() => {
    if (!selectedBrewerId && brewers.length > 0) {
      setSelectedBrewerId(brewers[0].id);
    }
  }, [brewers, selectedBrewerId]);

  const [newLabel, setNewLabel] = useState("");
  const [newStart, setNewStart] = useState("09:00");
  const [newEnd, setNewEnd] = useState("17:00");
  const [newDays, setNewDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editStart, setEditStart] = useState("");
  const [editEnd, setEditEnd] = useState("");
  const [editDays, setEditDays] = useState<number[]>([]);

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingCooldown, setTogglingCooldown] = useState(false);

  const startEdit = (slot: ServiceHour) => {
    setEditingId(slot.id);
    setEditLabel(slot.label);
    setEditStart(slot.start_time);
    setEditEnd(slot.end_time);
    setEditDays(slot.days_of_week);
  };

  const saveEdit = async () => {
    if (!editingId || !editLabel.trim() || editDays.length === 0) return;
    await onUpdate(editingId, selectedBrewerId, editLabel, editStart, editEnd, editDays);
    setEditingId(null);
  };

  const handleAdd = async () => {
    if (!selectedBrewerId || !newLabel.trim() || newDays.length === 0) return;
    await onAdd(selectedBrewerId, newLabel, newStart, newEnd, newDays);
    setNewLabel("");
    setNewStart("09:00");
    setNewEnd("17:00");
    setNewDays([0, 1, 2, 3, 4, 5, 6]);
  };

  return (
    <View style={s.card}>
      <Pressable
        style={s.headerRow}
        onPress={() => setOpen((v) => !v)}
        accessibilityRole="button"
        accessibilityLabel="Brewer Working Hours"
        accessibilityState={{ expanded: open }}
      >
        <View style={{ flex: 1 }}>
          <Text style={s.title}>Brewer Working Hours</Text>
          <Text style={s.headerMeta}>{serviceHours.length} slot{serviceHours.length !== 1 ? "s" : ""}{cooldownLimitEnabled ? " · cooldown on" : ""}</Text>
        </View>
        <HugeiconsIcon icon={open ? ArrowDown01Icon : ArrowRight01Icon} size={16} color={colors.softZinc} />
      </Pressable>
      {open && (
      <View style={s.body}>
      <Text style={s.subtitle}>Set each brewer&apos;s working hours. They&apos;re automatically marked inactive outside these hours unless they turn themselves back on.</Text>

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
        {brewers.map((bwr) => {
          const active = bwr.id === selectedBrewerId;
          return (
            <Pressable
              key={bwr.id}
              onPress={() => setSelectedBrewerId(bwr.id)}
              style={[s.dayChip, active && s.dayChipActive]}
              accessibilityRole="button"
              accessibilityLabel={bwr.name}
              accessibilityState={{ selected: active }}
            >
              <Text style={[s.dayChipText, active && s.dayChipTextActive]}>{bwr.name}</Text>
            </Pressable>
          );
        })}
      </View>

      {serviceHours.filter((slot) => slot.brewer_id === selectedBrewerId).length === 0 ? (
        <Text style={s.emptyText}>No working hours configured for this brewer.</Text>
      ) : (
        serviceHours.filter((slot) => slot.brewer_id === selectedBrewerId).map((slot) => {
          const isEditing = editingId === slot.id;
          return (
            <View key={slot.id} style={s.slotRow}>
              {isEditing ? (
                <View style={{ flex: 1, gap: 8 }}>
                  <TextInput style={s.input} value={editLabel} onChangeText={setEditLabel} placeholder="Slot label" placeholderTextColor={colors.softZinc} accessibilityLabel="Slot label" />
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    <TimeField label="Start" value={editStart} onChange={setEditStart} />
                    <TimeField label="End" value={editEnd} onChange={setEditEnd} />
                  </View>
                  <DayPicker days={editDays} onToggle={(d) => setEditDays((prev) => toggleDay(prev, d))} />
                  <View style={{ flexDirection: "row", gap: 8, justifyContent: "flex-end" }}>
                    <Pressable onPress={() => setEditingId(null)} style={s.cancelButton} accessibilityRole="button" accessibilityLabel="Cancel edit">
                      <Text style={s.cancelText}>Cancel</Text>
                    </Pressable>
                    <Pressable onPress={saveEdit} style={s.saveButton} accessibilityRole="button" accessibilityLabel="Save slot">
                      <Text style={s.saveText}>Save</Text>
                    </Pressable>
                  </View>
                </View>
              ) : (
                <>
                  <View style={{ flex: 1 }}>
                    <Text style={s.slotLabel}>{slot.label}</Text>
                    <Text style={s.slotTime}>{slot.start_time} – {slot.end_time}</Text>
                    <Text style={s.slotDays}>{formatDays(slot.days_of_week)}</Text>
                  </View>
                  <View style={{ flexDirection: "row", gap: 12 }}>
                    <Pressable onPress={() => startEdit(slot)} style={s.smallTapTarget} accessibilityRole="button" accessibilityLabel={`Edit ${slot.label}`} hitSlop={8}>
                      <Text style={s.editText}>Edit</Text>
                    </Pressable>
                    <Pressable
                      disabled={deletingId === slot.id}
                      onPress={async () => {
                        setDeletingId(slot.id);
                        try {
                          await onDelete(slot.id);
                        } finally {
                          setDeletingId(null);
                        }
                      }}
                      style={s.smallTapTarget}
                      accessibilityRole="button"
                      accessibilityLabel={`Delete ${slot.label}`}
                      accessibilityState={{ disabled: deletingId === slot.id, busy: deletingId === slot.id }}
                      hitSlop={8}
                    >
                      <Text style={s.deleteText}>{deletingId === slot.id ? "Deleting…" : "Delete"}</Text>
                    </Pressable>
                  </View>
                </>
              )}
            </View>
          );
        })
      )}

      <View style={s.addForm}>
        <TextInput style={s.input} value={newLabel} onChangeText={setNewLabel} placeholder="Slot label (e.g. Afternoon Tea)" placeholderTextColor={colors.softZinc} accessibilityLabel="New slot label" />
        <View style={{ flexDirection: "row", gap: 8 }}>
          <TimeField label="Start" value={newStart} onChange={setNewStart} />
          <TimeField label="End" value={newEnd} onChange={setNewEnd} />
        </View>
        <DayPicker days={newDays} onToggle={(d) => setNewDays((prev) => toggleDay(prev, d))} />
        <Pressable onPress={handleAdd} style={s.addButton} accessibilityRole="button" accessibilityLabel="Add slot">
          <HugeiconsIcon icon={Clock01Icon} size={14} color={colors.white} />
          <Text style={s.addButtonText}>Add Slot</Text>
        </Pressable>
      </View>

      <View style={s.cooldownSection}>
        <View style={s.cooldownRow}>
          <View style={{ flex: 1 }}>
            <Text style={s.cooldownTitle}>Ordering Limitations</Text>
            <Text style={s.subtitle}>Enforce a 3-hour cooldown between orders for employees.</Text>
          </View>
          <Switch
            disabled={togglingCooldown}
            value={cooldownLimitEnabled}
            onValueChange={async (next) => {
              setTogglingCooldown(true);
              try {
                await onToggleCooldown(next);
              } finally {
                setTogglingCooldown(false);
              }
            }}
            trackColor={{ false: colors.dividerZinc, true: colors.ink }}
            thumbColor={colors.white}
            accessibilityRole="switch"
            accessibilityLabel="3-hour cooldown"
            accessibilityState={{ checked: cooldownLimitEnabled, disabled: togglingCooldown }}
          />
        </View>
      </View>
      </View>
      )}
    </View>
  );
}

const styles = (colors: ColorRamp) =>
  StyleSheet.create({
    card: { borderRadius: 12, borderWidth: 1, borderColor: colors.dividerZinc, backgroundColor: colors.white, padding: 20 },
    headerRow: { minHeight: 44, flexDirection: "row", alignItems: "center", gap: 10 },
    title: { fontSize: 15, fontWeight: "700", color: colors.ink },
    headerMeta: { fontSize: 11, color: colors.softZinc, marginTop: 2 },
    body: { marginTop: 12 },
    subtitle: { fontSize: 11, color: colors.softZinc, marginBottom: 12 },
    emptyText: { fontSize: 12, color: colors.softZinc, textAlign: "center", paddingVertical: 16 },
    slotRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.dividerZinc },
    slotLabel: { fontSize: 13, fontWeight: "700", color: colors.ink },
    slotTime: { fontSize: 11, fontWeight: "600", color: colors.slateZinc, marginTop: 1 },
    slotDays: { fontSize: 11, color: colors.softZinc, marginTop: 1 },
    editText: { fontSize: 11, fontWeight: "700", color: colors.slateZinc },
    deleteText: { fontSize: 11, fontWeight: "700", color: colors.quietZinc },
    addForm: { marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: colors.dividerZinc, gap: 8 },
    input: { borderWidth: 1, borderColor: colors.hairlineZinc, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, fontSize: 12, color: colors.ink, backgroundColor: colors.white },
    fieldLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 0.5, textTransform: "uppercase", color: colors.softZinc, marginBottom: 4 },
    timeButton: { minHeight: 44, justifyContent: "center", borderWidth: 1, borderColor: colors.hairlineZinc, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, backgroundColor: colors.white },
    timeButtonText: { fontSize: 13, fontWeight: "700", color: colors.ink },
    dayChip: { minHeight: 36, justifyContent: "center", borderWidth: 1, borderColor: colors.hairlineZinc, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, backgroundColor: colors.white },
    dayChipActive: { backgroundColor: colors.ink, borderColor: colors.ink },
    dayChipText: { fontSize: 11, fontWeight: "700", color: colors.slateZinc },
    dayChipTextActive: { color: colors.white },
    addButton: { minHeight: 44, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: colors.ink, borderRadius: 8, paddingVertical: 10 },
    addButtonText: { color: colors.white, fontSize: 12, fontWeight: "700" },
    cancelButton: { minHeight: 40, justifyContent: "center", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, borderWidth: 1, borderColor: colors.hairlineZinc, backgroundColor: colors.white },
    cancelText: { fontSize: 11, fontWeight: "600", color: colors.slateZinc },
    saveButton: { minHeight: 40, justifyContent: "center", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, backgroundColor: colors.ink },
    saveText: { fontSize: 11, fontWeight: "600", color: colors.white },
    cooldownSection: { marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: colors.dividerZinc },
    cooldownRow: { flexDirection: "row", alignItems: "center", gap: 12 },
    cooldownTitle: { fontSize: 13, fontWeight: "700", color: colors.ink },
    smallTapTarget: { minHeight: 44, minWidth: 44, alignItems: "center", justifyContent: "center" },
  });
