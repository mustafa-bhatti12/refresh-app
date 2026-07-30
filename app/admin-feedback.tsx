import { Redirect } from "expo-router";
import { useRefresh } from "@/context/RefreshContext";
import { FeedbackScreen } from "@/components/admin/feedback-screen";

export default function AdminFeedback() {
  const { currentUser } = useRefresh();
  if (currentUser?.role !== "Admin") return <Redirect href="/home" />;
  return <FeedbackScreen />;
}
