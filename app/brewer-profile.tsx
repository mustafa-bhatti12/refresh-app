import { Redirect } from "expo-router";
import { useRefresh } from "@/context/RefreshContext";
import { ProfileScreen } from "@/components/profile-screen";

export default function BrewerProfile() {
  const { currentUser } = useRefresh();
  if (currentUser?.role !== "Brewer") return <Redirect href="/order" />;
  return <ProfileScreen standalone />;
}
