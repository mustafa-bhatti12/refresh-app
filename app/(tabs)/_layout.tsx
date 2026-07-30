import { Tabs } from "expo-router";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { Coffee01Icon, ReceiptTextIcon, Queue01Icon, ShieldUserIcon, User03Icon } from "@hugeicons/core-free-icons";
import { AppHeader } from "@/components/app-header";
import { ReviewModal } from "@/components/order/review-modal";
import { useRefresh } from "@/context/RefreshContext";
import { lightColors } from "@/constants/colors";

export default function TabsLayout() {
  const { currentUser, activeReviewOrder, isMandatoryReview, setReviewOrderId, submitReview, getDailyOrderNumber } = useRefresh();
  const isAdmin = currentUser?.role === "Admin";
  const isBrewer = currentUser?.role === "Brewer";

  return (
    <>
      <Tabs
        screenOptions={{
          header: () => <AppHeader />,
          tabBarActiveTintColor: lightColors.ink,
          tabBarInactiveTintColor: lightColors.softZinc,
        }}
      >
        <Tabs.Screen
          name="order"
          options={{
            title: "Order",
            href: isBrewer ? null : undefined,
            tabBarIcon: ({ color, size }) => <HugeiconsIcon icon={Coffee01Icon} size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="my-orders"
          options={{
            title: "My Orders",
            href: isAdmin || isBrewer ? null : undefined,
            tabBarIcon: ({ color, size }) => <HugeiconsIcon icon={ReceiptTextIcon} size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="queue"
          options={{
            title: "Queue",
            href: isAdmin ? undefined : null,
            tabBarIcon: ({ color, size }) => <HugeiconsIcon icon={Queue01Icon} size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="admin"
          options={{
            title: "Dashboard",
            href: isAdmin ? undefined : null,
            tabBarIcon: ({ color, size }) => <HugeiconsIcon icon={ShieldUserIcon} size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ color, size }) => <HugeiconsIcon icon={User03Icon} size={size} color={color} />,
          }}
        />
      </Tabs>

      {activeReviewOrder && (
        <ReviewModal
          order={activeReviewOrder}
          dailyNumber={getDailyOrderNumber(activeReviewOrder.id, activeReviewOrder.createdAt)}
          mandatory={isMandatoryReview}
          onSubmit={async (rating, comments) => {
            await submitReview(activeReviewOrder.id, rating, comments);
            setReviewOrderId(null);
          }}
          onCancel={() => setReviewOrderId(null)}
        />
      )}
    </>
  );
}
