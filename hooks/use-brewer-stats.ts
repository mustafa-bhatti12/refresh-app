import { useRefresh } from "@/context/RefreshContext";

export function useBrewerStats() {
  const { orders, systemDate } = useRefresh();

  const todaysOrders = orders.filter((o) => o.createdAt.startsWith(systemDate));
  const completedToday = todaysOrders.filter((o) => o.status === "Delivered" || o.status === "Not Found");
  const pendingToday = todaysOrders.filter((o) => o.status === "Pending");
  const deliveredToday = todaysOrders.filter((o) => o.status === "Delivered");

  const avgOrderMs =
    deliveredToday.length > 0
      ? deliveredToday.reduce((sum, o) => sum + (new Date(o.updatedAt).getTime() - new Date(o.createdAt).getTime()), 0) / deliveredToday.length
      : null;
  const avgOrderMins = avgOrderMs !== null ? Math.max(0, Math.round(avgOrderMs / 60000)) : null;
  const avgOrderTimeLabel = avgOrderMins !== null ? `${Math.floor(avgOrderMins / 60)}:${String(avgOrderMins % 60).padStart(2, "0")}` : null;

  return {
    totalToday: todaysOrders.length,
    completedToday: completedToday.length,
    pendingToday: pendingToday.length,
    avgOrderMins,
    avgOrderTimeLabel,
  };
}
