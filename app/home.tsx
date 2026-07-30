import { Redirect } from "expo-router";
import { useRefresh } from "@/context/RefreshContext";
import { BrewerScreen } from "@/components/brewer/brewer-screen";

export default function HomeScreen() {
  const { currentUser } = useRefresh();
  if (currentUser?.role !== "Brewer") return <Redirect href="/order" />;
  return <BrewerScreen />;
}
