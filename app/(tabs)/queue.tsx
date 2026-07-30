import { Redirect } from "expo-router";
import { useRefresh } from "@/context/RefreshContext";
import { BrewerScreen } from "@/components/brewer/brewer-screen";

export default function Queue() {
  const { currentUser } = useRefresh();
  if (currentUser?.role !== "Admin") return <Redirect href="/order" />;
  return <BrewerScreen embedded />;
}
