import { useState } from "react";
import { View, Text, TextInput, Pressable, Alert, StyleSheet } from "react-native";
import { useColors } from "@/constants/use-colors";
import type { ColorRamp } from "@/constants/colors";
import type { BrewerInvite, BrewerItem } from "@/context/RefreshContext";

const STATUSES: ("Active" | "On Break" | "Off")[] = ["Active", "On Break", "Off"];

export function BrewersPanel({
  brewers,
  brewerInvites,
  onAddBrewer,
  onRemoveInvite,
  onDeleteBrewer,
  onUpdateBrewer,
  onUpdateBrewerStatus,
}: {
  brewers: BrewerItem[];
  brewerInvites: BrewerInvite[];
  onAddBrewer: (name: string, contact: string) => Promise<void>;
  onRemoveInvite: (email: string) => Promise<void>;
  onDeleteBrewer: (id: string) => Promise<void>;
  onUpdateBrewer: (id: string, name: string, contact: string) => Promise<void>;
  onUpdateBrewerStatus: (id: string, status: "Active" | "On Break" | "Off") => Promise<void>;
}) {
  const colors = useColors();
  const s = styles(colors);
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [adding, setAdding] = useState(false);
  const [removingEmail, setRemovingEmail] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editContact, setEditContact] = useState("");

  const handleAdd = async () => {
    if (!name.trim() || !contact.trim()) return;
    setAdding(true);
    try {
      await onAddBrewer(name, contact);
      setName("");
      setContact("");
    } catch (err) {
      Alert.alert("Couldn't add brewer", err instanceof Error ? err.message : "Try again.");
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = (bwr: BrewerItem) => {
    Alert.alert("Remove brewer?", `Remove ${bwr.name}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          setDeletingId(bwr.id);
          try {
            await onDeleteBrewer(bwr.id);
          } finally {
            setDeletingId(null);
          }
        },
      },
    ]);
  };

  const startEdit = (bwr: BrewerItem) => {
    setEditingId(bwr.id);
    setEditName(bwr.name);
    setEditContact(bwr.contact);
  };

  const saveEdit = async (id: string) => {
    if (!editName.trim()) return;
    await onUpdateBrewer(id, editName, editContact);
    setEditingId(null);
  };

  return (
    <View style={s.card}>
      <Text style={s.title}>Brewers</Text>
      <Text style={s.subtitle}>Pre-assign by email — they become a Brewer automatically the first time they sign in with that Google account.</Text>

      <TextInput style={s.input} value={name} onChangeText={setName} placeholder="Brewer name" placeholderTextColor={colors.softZinc} />
      <TextInput style={s.input} value={contact} onChangeText={setContact} placeholder="Google account email" placeholderTextColor={colors.softZinc} autoCapitalize="none" keyboardType="email-address" />
      <Pressable disabled={adding} onPress={handleAdd} style={s.addButton}>
        <Text style={s.addButtonText}>{adding ? "Adding…" : "Pre-assign Brewer +"}</Text>
      </Pressable>

      {brewerInvites.length > 0 && (
        <View style={{ marginTop: 14 }}>
          <Text style={s.subLabel}>Pending Invites</Text>
          {brewerInvites.map((inv) => (
            <View key={inv.email} style={s.inviteRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.name}>{inv.name}</Text>
                <Text style={s.contact}>{inv.email}</Text>
              </View>
              <Pressable disabled={removingEmail === inv.email} onPress={async () => { setRemovingEmail(inv.email); try { await onRemoveInvite(inv.email); } finally { setRemovingEmail(null); } }}>
                <Text style={s.deleteText}>{removingEmail === inv.email ? "Cancelling…" : "Cancel"}</Text>
              </Pressable>
            </View>
          ))}
        </View>
      )}

      <View style={{ marginTop: 14 }}>
        {brewers.map((bwr, idx) => {
          const isEditing = editingId === bwr.id;
          return (
            <View key={bwr.id} style={[s.row, idx === brewers.length - 1 && { borderBottomWidth: 0 }]}>
              {isEditing ? (
                <View style={{ flex: 1, gap: 6 }}>
                  <TextInput style={s.inlineInput} value={editName} onChangeText={setEditName} placeholder="Name" placeholderTextColor={colors.softZinc} />
                  <TextInput style={s.inlineInput} value={editContact} onChangeText={setEditContact} placeholder="Email" placeholderTextColor={colors.softZinc} />
                  <View style={{ flexDirection: "row", gap: 6 }}>
                    {STATUSES.map((st) => (
                      <Pressable key={st} onPress={() => onUpdateBrewerStatus(bwr.id, st)} style={[s.statusChip, bwr.status === st && s.statusChipActive]}>
                        <Text style={[s.statusChipText, bwr.status === st && s.statusChipTextActive]}>{st}</Text>
                      </Pressable>
                    ))}
                  </View>
                  <View style={{ flexDirection: "row", gap: 8, justifyContent: "flex-end" }}>
                    <Pressable onPress={() => setEditingId(null)} style={s.cancelButton}>
                      <Text style={s.cancelText}>Cancel</Text>
                    </Pressable>
                    <Pressable onPress={() => saveEdit(bwr.id)} style={s.saveButton}>
                      <Text style={s.saveText}>Save</Text>
                    </Pressable>
                  </View>
                </View>
              ) : (
                <>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <Text style={s.name}>{bwr.name}</Text>
                      <View style={s.statusPill}>
                        <Text style={s.statusPillText}>{bwr.status}</Text>
                      </View>
                    </View>
                    <Text style={s.contact}>{bwr.contact}</Text>
                  </View>
                  <View style={{ flexDirection: "row", gap: 12 }}>
                    <Pressable onPress={() => startEdit(bwr)}>
                      <Text style={s.editText}>Edit</Text>
                    </Pressable>
                    <Pressable disabled={deletingId === bwr.id} onPress={() => handleDelete(bwr)}>
                      <Text style={s.deleteText}>{deletingId === bwr.id ? "Removing…" : "Delete"}</Text>
                    </Pressable>
                  </View>
                </>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = (colors: ColorRamp) =>
  StyleSheet.create({
    card: { borderRadius: 12, borderWidth: 1, borderColor: colors.dividerZinc, backgroundColor: colors.white, padding: 20 },
    title: { fontSize: 15, fontWeight: "700", color: colors.ink },
    subtitle: { fontSize: 11, color: colors.softZinc, marginTop: 4, marginBottom: 12 },
    subLabel: { fontSize: 10, fontWeight: "700", letterSpacing: 0.6, textTransform: "uppercase", color: colors.softZinc, marginBottom: 6 },
    input: { borderWidth: 1, borderColor: colors.hairlineZinc, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, fontSize: 12, color: colors.ink, backgroundColor: colors.white, marginBottom: 8 },
    inlineInput: { borderWidth: 1, borderColor: colors.hairlineZinc, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 6, fontSize: 12, color: colors.ink, backgroundColor: colors.white },
    addButton: { backgroundColor: colors.ink, borderRadius: 8, paddingVertical: 9, alignItems: "center" },
    addButtonText: { color: colors.white, fontSize: 12, fontWeight: "700" },
    inviteRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: colors.surfaceZinc, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 8, marginBottom: 4 },
    row: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.dividerZinc },
    name: { fontSize: 13, fontWeight: "600", color: colors.ink },
    contact: { fontSize: 11, color: colors.softZinc, marginTop: 1 },
    statusPill: { backgroundColor: colors.surfaceZinc, borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 },
    statusPillText: { fontSize: 9, fontWeight: "700", color: colors.midZinc },
    statusChip: { borderWidth: 1, borderColor: colors.hairlineZinc, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, backgroundColor: colors.white },
    statusChipActive: { backgroundColor: colors.ink, borderColor: colors.ink },
    statusChipText: { fontSize: 10, fontWeight: "700", color: colors.slateZinc },
    statusChipTextActive: { color: colors.white },
    editText: { fontSize: 11, fontWeight: "700", color: colors.slateZinc },
    deleteText: { fontSize: 11, fontWeight: "700", color: colors.quietZinc },
    cancelButton: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, borderWidth: 1, borderColor: colors.hairlineZinc, backgroundColor: colors.white },
    cancelText: { fontSize: 11, fontWeight: "600", color: colors.slateZinc },
    saveButton: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, backgroundColor: colors.ink },
    saveText: { fontSize: 11, fontWeight: "600", color: colors.white },
  });
