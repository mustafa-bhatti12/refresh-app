import { useState } from "react";
import { View, Text, TextInput, Pressable, Alert, StyleSheet } from "react-native";
import { useRefresh } from "@/context/RefreshContext";

export default function OnboardingScreen() {
  const { completeOnboarding, floors } = useRefresh();
  const [name, setName] = useState("");
  const [floor, setFloor] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert("Name required", "Enter your name to continue.");
      return;
    }
    setSubmitting(true);
    try {
      await completeOnboarding(name, floor ?? undefined);
    } catch (err) {
      Alert.alert("Something went wrong", err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome</Text>
      <TextInput style={styles.input} placeholder="Your name" value={name} onChangeText={setName} />
      <Text style={styles.label}>Floor (if you're an employee)</Text>
      <View style={styles.floorRow}>
        {floors.map((f) => (
          <Pressable key={f} style={[styles.floorChip, floor === f && styles.floorChipActive]} onPress={() => setFloor(f)}>
            <Text style={[styles.floorChipText, floor === f && styles.floorChipTextActive]}>{f}</Text>
          </Pressable>
        ))}
      </View>
      <Pressable style={styles.button} onPress={handleSubmit} disabled={submitting}>
        <Text style={styles.buttonText}>{submitting ? "Saving…" : "Continue"}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fafafa", padding: 24, paddingTop: 80 },
  title: { fontSize: 28, fontWeight: "800", color: "#09090b", marginBottom: 24 },
  input: { borderWidth: 1, borderColor: "#d4d4d4", borderRadius: 8, padding: 12, marginBottom: 16, backgroundColor: "#ffffff" },
  label: { fontSize: 11, fontWeight: "700", letterSpacing: 0.9, textTransform: "uppercase", color: "#71717a", marginBottom: 8 },
  floorRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 24 },
  floorChip: { borderWidth: 1, borderColor: "#d4d4d4", borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12, backgroundColor: "#ffffff" },
  floorChipActive: { backgroundColor: "#09090b", borderColor: "#09090b" },
  floorChipText: { color: "#27272a", fontSize: 14 },
  floorChipTextActive: { color: "#ffffff" },
  button: { backgroundColor: "#09090b", borderRadius: 12, paddingVertical: 12, alignItems: "center" },
  buttonText: { color: "#ffffff", fontWeight: "700", fontSize: 14 },
});
