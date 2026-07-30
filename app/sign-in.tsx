import { useState } from "react";
import { View, Text, Pressable, Alert, StyleSheet } from "react-native";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { Coffee02Icon, SecurityCheckIcon, FlashIcon, LockIcon, GoogleIcon } from "@hugeicons/core-free-icons";
import { useColors } from "@/constants/use-colors";
import type { ColorRamp } from "@/constants/colors";
import { signInWithGoogle } from "@/lib/google-signin";

const FEATURES = [
  { icon: SecurityCheckIcon, title: "Secure & Private", desc: "Your data is safe and never shared." },
  { icon: FlashIcon, title: "Fast & Simple", desc: "One tap is all it takes." },
  { icon: Coffee02Icon, title: "Made for the Office", desc: "Order, track and enjoy with ease." },
];

export default function SignInScreen() {
  const colors = useColors();
  const s = styles(colors);
  const [signingIn, setSigningIn] = useState(false);

  const handleSignIn = async () => {
    setSigningIn(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      Alert.alert("Sign-in failed", err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSigningIn(false);
    }
  };

  return (
    <View style={s.container}>
      <View style={s.content}>
        <HugeiconsIcon icon={Coffee02Icon} size={56} color={colors.ink} strokeWidth={1.5} />
        <Text style={s.title}>Welcome to Refresh</Text>
        <Text style={s.subtitle}>Sign in with your work Google account to get started.</Text>

        <View style={s.featureCard}>
          {FEATURES.map((f, idx) => (
            <View key={f.title} style={[s.featureRow, idx === FEATURES.length - 1 && { borderBottomWidth: 0 }]}>
              <View style={s.featureIconWrap}>
                <HugeiconsIcon icon={f.icon} size={20} color={colors.ink} strokeWidth={1.5} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.featureTitle}>{f.title}</Text>
                <Text style={s.featureDesc}>{f.desc}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <View style={s.footer}>
        <Pressable style={s.button} onPress={handleSignIn} disabled={signingIn}>
          {!signingIn && <HugeiconsIcon icon={GoogleIcon} size={18} color={colors.ink} />}
          <Text style={s.buttonText}>{signingIn ? "Signing in…" : "Continue with Google"}</Text>
        </Pressable>
        <View style={s.lockRow}>
          <HugeiconsIcon icon={LockIcon} size={13} color={colors.softZinc} strokeWidth={1.5} />
          <Text style={s.lockText}>Only your work account can sign in.</Text>
        </View>
      </View>
    </View>
  );
}

const styles = (colors: ColorRamp) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.paper, justifyContent: "space-between", padding: 24, paddingBottom: 32 },
    content: { alignItems: "center", marginTop: 80 },
    title: { fontSize: 26, fontWeight: "800", letterSpacing: -0.3, color: colors.ink, marginTop: 20, textAlign: "center" },
    subtitle: { fontSize: 14, color: colors.quietZinc, textAlign: "center", marginTop: 8, lineHeight: 20, paddingHorizontal: 12 },
    featureCard: { width: "100%", marginTop: 40 },
    featureRow: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.dividerZinc },
    featureIconWrap: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surfaceZinc, alignItems: "center", justifyContent: "center" },
    featureTitle: { fontSize: 14, fontWeight: "700", color: colors.ink },
    featureDesc: { fontSize: 12, color: colors.softZinc, marginTop: 2 },
    footer: { gap: 14 },
    button: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.ink, borderRadius: 12, paddingVertical: 16 },
    buttonText: { color: colors.ink, fontWeight: "700", fontSize: 15 },
    lockRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
    lockText: { fontSize: 12, color: colors.softZinc },
  });
