import { View, StyleSheet, type TextStyle } from "react-native";
import Animated, { SlideInUp, SlideOutUp } from "react-native-reanimated";

// RN has no MotionValue digit-wheel like the web Counter (reactbits/Counter) — this is
// the lazy equivalent: each digit position is a fixed-size clipped slot, and a fresh
// `key={char}` on the animated text remounts it so `entering`/`exiting` plays a roll
// whenever that digit changes. No continuous shared-value math needed.
export function Counter({
  value,
  fontSize = 13,
  color,
  fontWeight = "700",
  style,
}: {
  value: number;
  fontSize?: number;
  color?: string;
  fontWeight?: TextStyle["fontWeight"];
  style?: object;
}) {
  const chars = String(value).split("");
  const height = Math.round(fontSize * 1.3);
  const digitWidth = Math.round(fontSize * 0.64);

  return (
    <View style={[styles.row, style]}>
      {chars.map((ch, i) => (
        <View key={i} style={{ height, width: ch === "-" ? digitWidth * 0.6 : digitWidth, overflow: "hidden" }}>
          <Animated.Text
            key={ch}
            entering={SlideInUp.duration(220)}
            exiting={SlideOutUp.duration(160)}
            style={[
              styles.digit,
              { position: "absolute", left: 0, right: 0, fontSize, color, fontWeight, height, lineHeight: height },
            ]}
          >
            {ch}
          </Animated.Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row" },
  digit: { textAlign: "center", fontVariant: ["tabular-nums"] },
});
