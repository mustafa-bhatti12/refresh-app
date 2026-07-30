import { useEffect, useRef } from "react";
import { Animated, StyleProp, ViewStyle } from "react-native";
import { useColors } from "@/constants/use-colors";

export function Skeleton({ style }: { style?: StyleProp<ViewStyle> }) {
  const colors = useColors();
  const opacity = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.5, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return <Animated.View style={[{ borderRadius: 8, backgroundColor: colors.dividerZinc, opacity }, style]} />;
}
