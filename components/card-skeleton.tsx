import { View } from "react-native";
import { useColors } from "@/constants/use-colors";
import { Skeleton } from "./skeleton";

export function CardSkeleton({ lines = 3 }: { lines?: number }) {
  const colors = useColors();
  return (
    <View style={{ borderRadius: 12, borderWidth: 1, borderColor: colors.dividerZinc, backgroundColor: colors.white, padding: 20, gap: 12 }}>
      <Skeleton style={{ width: 120, height: 16 }} />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} style={{ width: "100%", height: 40, borderRadius: 8 }} />
      ))}
    </View>
  );
}
