import React, { useEffect } from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useToastStore } from '@/stores/toast-store';
import { useAppTheme } from '@/hooks/use-app-theme';

const toastConfig = {
  success: {
    icon: 'checkmark' as const,
    title: 'Berhasil',
    accent: '#10B981',
    tint: 'rgba(16, 185, 129, 0.14)',
  },
  error: {
    icon: 'alert' as const,
    title: 'Terjadi kendala',
    accent: '#F43F5E',
    tint: 'rgba(244, 63, 94, 0.14)',
  },
  info: {
    icon: 'information' as const,
    title: 'Informasi',
    accent: '#3380FF',
    tint: 'rgba(51, 128, 255, 0.14)',
  },
};

export function Toast() {
  const { message, type, isVisible, hideToast } = useToastStore();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(-140);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.96);

  useEffect(() => {
    if (isVisible) {
      translateY.value = withSpring(insets.top + 10, { damping: 16, stiffness: 150 });
      opacity.value = withTiming(1, { duration: 180 });
      scale.value = withSpring(1, { damping: 14, stiffness: 180 });
    } else {
      translateY.value = withTiming(-140, { duration: 220 });
      opacity.value = withTiming(0, { duration: 180 });
      scale.value = withTiming(0.96, { duration: 180 });
    }
  }, [isVisible, insets.top, opacity, scale, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
    opacity: opacity.value,
  }));

  if (!message) return null;
  const config = toastConfig[type];

  return (
    <Animated.View
      style={[styles.container, animatedStyle]}
      className="absolute top-0 left-0 right-0 z-50 px-4"
      pointerEvents="box-none"
    >
      <View
        className="flex-row items-center px-4 py-3.5 rounded-3xl w-full self-center"
        style={[styles.toast, { backgroundColor: colors.card, borderColor: colors.border }]}
      >
        <View
          className="w-11 h-11 rounded-2xl items-center justify-center mr-3"
          style={{ backgroundColor: config.tint }}
        >
          <Ionicons name={config.icon} size={21} color={config.accent} />
        </View>
        <View className="flex-1 pr-2">
          <Text className="text-xs font-sans-bold mb-0.5" style={{ color: config.accent }}>
            {config.title}
          </Text>
          <Text className="text-sm font-sans-medium leading-5" style={{ color: colors.text }}>
            {message}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Tutup notifikasi"
          className="w-9 h-9 rounded-full items-center justify-center"
          style={{ backgroundColor: colors.background }}
          onPress={hideToast}
        >
          <Ionicons name="close" size={18} color={colors.muted} />
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    elevation: 24,
  },
  toast: {
    maxWidth: 440,
    borderWidth: 1,
    elevation: 18,
    shadowColor: '#020617',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 20,
  },
});
