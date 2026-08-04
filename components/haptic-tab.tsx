import { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { PlatformPressable } from '@react-navigation/elements';
import * as Haptics from 'expo-haptics';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

export function HapticTab(props: BottomTabBarButtonProps) {
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <PlatformPressable
      {...props}
      onPressIn={(ev) => {
        if (process.env.EXPO_OS === 'ios') {
          // Add a soft haptic feedback when pressing down on the tabs.
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        scale.value = withSpring(0.88, { damping: 14, stiffness: 320 });
        props.onPressIn?.(ev);
      }}
      onPressOut={(ev) => {
        scale.value = withSpring(1, { damping: 12, stiffness: 260 });
        props.onPressOut?.(ev);
      }}
    >
      <Animated.View style={[{ flex: 1, alignItems: 'center', justifyContent: 'center' }, style]}>
        {props.children}
      </Animated.View>
    </PlatformPressable>
  );
}
