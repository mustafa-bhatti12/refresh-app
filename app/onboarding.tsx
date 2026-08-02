import { useState } from "react";
import { View, Text, TextInput, Pressable, Alert, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/constants/use-colors";
import type { ColorRamp } from "@/constants/colors";
import { useRefresh } from "@/context/RefreshContext";

export default function OnboardingScreen() {
  const colors = useColors();
  const s = styles(colors);
  const insets = useSafeAreaInsets();
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
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={[s.container, { paddingTop: insets.top + 24 }]}>
        <Text style={s.title}>Welcome</Text>
        <TextInput
          style={s.input}
          placeholder="Your name"
          placeholderTextColor={colors.softZinc}
          value={name}
          onChangeText={setName}
          accessibilityLabel="Your name"
          maxFontSizeMultiplier={1.3}
        />
        <Text style={s.label}>Floor (if you&apos;re an employee)</Text>
        <View style={s.floorRow}>
          {floors.map((f) => (
            <Pressable
              key={f}
              style={[s.floorChip, floor === f && s.floorChipActive]}
              onPress={() => setFloor(f)}
              accessibilityRole="button"
              accessibilityLabel={`Floor ${f}`}
              accessibilityState={{ selected: floor === f }}
            >
              <Text style={[s.floorChipText, floor === f && s.floorChipTextActive]}>{f}</Text>
            </Pressable>
          ))}
        </View>
        <Pressable
          style={[s.button, submitting && s.buttonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
          accessibilityRole="button"
          accessibilityLabel="Continue"
          accessibilityState={{ disabled: submitting }}
        >
          <Text style={s.buttonText}>{submitting ? "Saving…" : "Continue"}</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = (colors: ColorRamp) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.paper, padding: 24 },
    title: { fontSize: 28, fontWeight: "800", color: colors.ink, marginBottom: 24 },
    input: { borderWidth: 1, borderColor: colors.hairlineZinc, borderRadius: 8, padding: 12, marginBottom: 16, backgroundColor: colors.white, color: colors.ink },
    label: { fontSize: 11, fontWeight: "700", letterSpacing: 0.9, textTransform: "uppercase", color: colors.quietZinc, marginBottom: 8 },
    floorRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 24 },
    floorChip: { minHeight: 44, justifyContent: "center", borderWidth: 1, borderColor: colors.hairlineZinc, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12, backgroundColor: colors.white },
    floorChipActive: { backgroundColor: colors.ink, borderColor: colors.ink },
    floorChipText: { color: colors.slateZinc, fontSize: 14 },
    floorChipTextActive: { color: colors.white },
    button: { minHeight: 44, backgroundColor: colors.ink, borderRadius: 12, paddingVertical: 12, alignItems: "center", justifyContent: "center" },
    buttonDisabled: { opacity: 0.6 },
    buttonText: { color: colors.white, fontWeight: "700", fontSize: 14 },
  });
