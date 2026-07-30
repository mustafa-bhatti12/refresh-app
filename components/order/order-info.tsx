import { View, Text, StyleSheet } from "react-native";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { Coffee01Icon, Location01Icon, Queue01Icon } from "@hugeicons/core-free-icons";
import { useColors } from "@/constants/use-colors";
import type { ColorRamp } from "@/constants/colors";

const ITEMS = [
  { icon: Coffee01Icon, title: "Orders are prepared fresh", body: "Made when you order." },
  { icon: Location01Icon, title: "Delivered to your floor", body: "We'll bring it to the brewer area." },
  { icon: Queue01Icon, title: "Respect the queue", body: "First come, first served." },
];

export function OrderInfo() {
  const colors = useColors();
  const s = styles(colors);
  return (
    <View style={s.card}>
      <Text style={s.title}>Order Info</Text>
      <View style={{ gap: 14 }}>
        {ITEMS.map((item) => (
          <View key={item.title} style={{ flexDirection: "row", gap: 10 }}>
            <HugeiconsIcon icon={item.icon} size={16} color={colors.quietZinc} />
            <View style={{ flex: 1 }}>
              <Text style={s.itemTitle}>{item.title}</Text>
              <Text style={s.itemBody}>{item.body}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = (colors: ColorRamp) =>
  StyleSheet.create({
    card: { borderRadius: 12, borderWidth: 1, borderColor: colors.dividerZinc, backgroundColor: colors.white, padding: 24 },
    title: { fontSize: 18, fontWeight: "700", color: colors.ink, marginBottom: 12 },
    itemTitle: { fontSize: 13, fontWeight: "600", color: colors.slateZinc },
    itemBody: { fontSize: 11, color: colors.softZinc, marginTop: 1 },
  });
