import { useRefresh } from "@/context/RefreshContext";
import { OrderScreen } from "@/components/order/order-screen";
import { BrewerScreen } from "@/components/brewer/brewer-screen";

export default function HomeScreen() {
  const { currentUser } = useRefresh();

  if (currentUser?.role === "Brewer") {
    return <BrewerScreen />;
  }

  return <OrderScreen />;
}
