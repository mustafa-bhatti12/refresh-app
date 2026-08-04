import { useState } from "react";
import { View, Text, Pressable, Alert, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";
import { useColors } from "@/constants/use-colors";
import type { ColorRamp } from "@/constants/colors";
import { signInWithGoogle } from "@/lib/google-signin";
import { AuroraBackground } from "@/components/aurora-background";

function GoogleLogo({ size = 18 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20">
      <Path d="M19.6 10.23c0-.82-.1-1.42-.25-2.05H10v3.72h5.5c-.15.96-.74 2.31-2.04 3.22v.02l2.94 2.28c.16-.15 1.87-1.72 1.87-4.19z" fill="#4285F4" />
      <Path d="M10 20c2.7 0 4.96-.92 6.62-2.36l-2.94-2.28c-.83.55-1.85.92-3.68.92-2.83 0-5.23-1.92-6.09-4.5H.99v2.36C2.6 17.68 6.02 20 10 20z" fill="#34A853" />
      <Path d="M3.91 11.78A5.86 5.86 0 0 1 3.54 10c0-.62.13-1.21.34-1.78V5.86H1.87A9.44 9.44 0 0 0 1 10c0 1.5.36 2.93.99 4.13l2.92-2.35z" fill="#FBBC05" />
      <Path d="M10 3.58c1.85 0 3.1.8 3.81 1.46l2.76-2.7C14.94.98 12.7 0 10 0 6.02 0 2.6 2.32.99 5.86l2.92 2.28C4.77 5.56 7.17 3.58 10 3.58z" fill="#EA4335" />
    </Svg>
  );
}

export default function SignInScreen() {
  const colors = useColors();
  const s = styles(colors);
  const insets = useSafeAreaInsets();
  const [signingIn, setSigningIn] = useState(false);

  const scale = useSharedValue(1);
  const buttonStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

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
    <View style={[s.container, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>
      <AuroraBackground />
      <Animated.View entering={FadeInDown.duration(450)} style={s.card}>
        <Image source={require("@/assets/images/logo.png")} style={s.logo} contentFit="contain" tintColor={colors.ink} />
        <Text style={s.title}>Welcome to Refresh</Text>
        <Text style={s.subtitle}>Sign in with your work Google account to get started.</Text>

        <Pressable
          onPress={handleSignIn}
          onPressIn={() => { scale.value = withSpring(0.97, { damping: 16, stiffness: 320 }); }}
          onPressOut={() => { scale.value = withSpring(1, { damping: 14, stiffness: 260 }); }}
          disabled={signingIn}
          accessibilityRole="button"
          accessibilityLabel="Continue with Google"
          accessibilityState={{ disabled: signingIn, busy: signingIn }}
        >
          <Animated.View style={[s.button, buttonStyle, signingIn && s.buttonDisabled]}>
            {!signingIn && <GoogleLogo size={18} />}
            <Text style={s.buttonText}>{signingIn ? "Signing in…" : "Continue with Google"}</Text>
          </Animated.View>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = (colors: ColorRamp) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.paper, alignItems: "center", justifyContent: "center", padding: 24, overflow: "hidden" },
    card: {
      width: "100%",
      maxWidth: 380,
      alignItems: "center",
      backgroundColor: colors.white,
      borderWidth: 1,
      borderColor: colors.dividerZinc,
      borderRadius: 20,
      padding: 28,
    },
    logo: { width: 72, height: 72 },
    title: { fontSize: 26, fontWeight: "800", letterSpacing: -0.3, color: colors.ink, marginTop: 20, textAlign: "center" },
    subtitle: { fontSize: 14, color: colors.quietZinc, textAlign: "center", marginTop: 8, lineHeight: 20, paddingHorizontal: 12 },
    button: { minHeight: 44, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.ink, borderRadius: 12, paddingVertical: 16, paddingHorizontal: 24, marginTop: 40, width: "100%" },
    buttonDisabled: { opacity: 0.6 },
    buttonText: { color: colors.ink, fontWeight: "700", fontSize: 15 },
  });
