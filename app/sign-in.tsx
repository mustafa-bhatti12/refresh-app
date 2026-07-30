import { useState } from "react";
import { View, Text, Pressable, Alert, StyleSheet } from "react-native";
import { signInWithGoogle } from "@/lib/google-signin";

export default function SignInScreen() {
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
    <View style={styles.container}>
      <Text style={styles.title}>Refresh</Text>
      <Pressable style={styles.button} onPress={handleSignIn} disabled={signingIn}>
        <Text style={styles.buttonText}>{signingIn ? "Signing in…" : "Sign in with Google"}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#fafafa", padding: 24 },
  title: { fontSize: 28, fontWeight: "800", color: "#09090b", marginBottom: 32 },
  button: { backgroundColor: "#09090b", borderRadius: 12, paddingVertical: 12, paddingHorizontal: 20 },
  buttonText: { color: "#ffffff", fontWeight: "700", fontSize: 14 },
});
