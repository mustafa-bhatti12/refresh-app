import { Redirect } from "expo-router";
import { useRefresh } from "@/context/RefreshContext";
import { AdminScreen } from "@/components/admin/admin-screen";

export default function Admin() {
  const { currentUser } = useRefresh();
  if (currentUser?.role !== "Admin") return <Redirect href="/order" />;
  return <AdminScreen />;
}
