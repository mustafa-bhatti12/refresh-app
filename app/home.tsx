import { View, Text, Pressable, StyleSheet } from "react-native";
import { useRefresh } from "@/context/RefreshContext";

export default function HomeScreen() {
  const { currentUser, logout } = useRefresh();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Signed in as {currentUser?.role}</Text>
      <Text style={styles.subtitle}>{currentUser?.name}</Text>
      <Pressable style={styles.button} onPress={() => logout()}>
        <Text style={styles.buttonText}>Sign out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#fafafa", padding: 24 },
  title: { fontSize: 18, fontWeight: "700", color: "#09090b", marginBottom: 4 },
  subtitle: { fontSize: 14, color: "#71717a", marginBottom: 32 },
  button: { borderWidth: 1, borderColor: "#d4d4d4", borderRadius: 12, paddingVertical: 12, paddingHorizontal: 20, backgroundColor: "#ffffff" },
  buttonText: { color: "#27272a", fontWeight: "700", fontSize: 14 },
});
