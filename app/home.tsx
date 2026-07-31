import { View } from "react-native";
import { Redirect } from "expo-router";
import { useRefresh } from "@/context/RefreshContext";
import { AppHeader } from "@/components/app-header";
import { BrewerScreen } from "@/components/brewer/brewer-screen";

export default function HomeScreen() {
  const { currentUser } = useRefresh();
  if (currentUser?.role !== "Brewer") return <Redirect href="/order" />;
  return (
    <View style={{ flex: 1 }}>
      <AppHeader />
      <BrewerScreen />
    </View>
  );
}
