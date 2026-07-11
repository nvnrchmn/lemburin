import React, { useEffect } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';

import { useToastStore } from '@/stores/toast-store';

export function Toast() {
  const { message, type, isVisible, hideToast } = useToastStore();
  const insets = useSafeAreaInsets();
  
  const translateY = useSharedValue(-100);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (isVisible) {
      translateY.value = withSpring(insets.top + 10, { damping: 12, stiffness: 90 });
      opacity.value = withTiming(1, { duration: 200 });
    } else {
      translateY.value = withTiming(-100, { duration: 300 }, () => {
        runOnJS(hideToast)();
      });
      opacity.value = withTiming(0, { duration: 300 });
    }
  }, [isVisible, insets.top, translateY, opacity, hideToast]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (!isVisible && opacity.value === 0) return null;

  const bgColors = {
    success: 'bg-emerald-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
  };

  const icons = {
    success: 'checkmark.circle.fill',
    error: 'exclamationmark.circle.fill',
    info: 'info.circle.fill',
  };

  return (
    <Animated.View
      style={[styles.container, animatedStyle]}
      className="absolute top-0 left-0 right-0 z-50 items-center px-4"
      pointerEvents="none"
    >
      <View className={`flex-row items-center px-4 py-3 rounded-2xl shadow-lg ${bgColors[type]} max-w-sm w-full`}>
        <SymbolView name={icons[type] as any} size={24} tintColor="#fff" style={{ marginRight: 12 }} />
        <Text className="text-white font-medium text-base flex-1">{message}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    elevation: 10, // for android shadow
  },
});
