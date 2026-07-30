import { View, Text, Pressable, StyleSheet } from "react-native";
import { useColors } from "@/constants/use-colors";
import type { ColorRamp } from "@/constants/colors";
import { useRefresh } from "@/context/RefreshContext";
import { OrderScreen } from "@/components/order/order-screen";

export default function HomeScreen() {
  const { currentUser, logout } = useRefresh();
  const colors = useColors();
  const s = styles(colors);

  if (currentUser?.role === "Brewer") {
    return (
      <View style={s.container}>
        <Text style={s.title}>Brewer workstation</Text>
        <Text style={s.subtitle}>The brewer queue screen isn&apos;t built yet.</Text>
        <Pressable style={s.button} onPress={() => logout()}>
          <Text style={s.buttonText}>Sign out</Text>
        </Pressable>
      </View>
    );
  }

  return <OrderScreen />;
}

const styles = (colors: ColorRamp) =>
  StyleSheet.create({
    container: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.paper, padding: 24 },
    title: { fontSize: 18, fontWeight: "700", color: colors.ink, marginBottom: 4 },
    subtitle: { fontSize: 14, color: colors.quietZinc, marginBottom: 32, textAlign: "center" },
    button: { borderWidth: 1, borderColor: colors.hairlineZinc, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 20, backgroundColor: colors.white },
    buttonText: { color: colors.slateZinc, fontWeight: "700", fontSize: 14 },
  });
