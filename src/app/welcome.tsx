import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { SymbolView } from 'expo-symbols';

const ONBOARDING_DATA = [
  {
    title: 'Catat Lembur',
    description: 'Catat setiap aktivitas lembur Anda dengan cepat dan mudah.',
    icon: 'calendar.badge.plus',
  },
  {
    title: 'Hitung Otomatis',
    description: 'Kalkulasi estimasi upah lembur secara instan sesuai formula.',
    icon: 'function',
  },
  {
    title: 'Verifikasi Gaji',
    description: 'Bandingkan hasil hitung dengan slip gaji dari perusahaan.',
    icon: 'checkmark.shield.fill',
  },
];

export default function WelcomeScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(currentIndex, { duration: 400 });
  }, [currentIndex, progress]);

  const handleNext = async () => {
    if (currentIndex < ONBOARDING_DATA.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      await AsyncStorage.setItem('hasSeenOnboarding', 'true');
      router.replace('/(auth)/login');
    }
  };

  const animatedIconStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      progress.value,
      [currentIndex - 1, currentIndex, currentIndex + 1],
      [0.5, 1, 0.5],
      Extrapolation.CLAMP
    );
    const opacity = interpolate(
      progress.value,
      [currentIndex - 1, currentIndex, currentIndex + 1],
      [0, 1, 0],
      Extrapolation.CLAMP
    );
    return {
      transform: [{ scale }],
      opacity,
    };
  });

  return (
    <View className="flex-1 bg-dark-bg">
      <StatusBar style="light" />
      
      {/* Background Gradient */}
      <LinearGradient
        colors={['#1e293b', '#0f172a', '#020617']}
        className="absolute inset-0"
      />

      {/* Decorative Blob */}
      <Animated.View 
        className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-primary-600/20 blur-3xl"
        style={animatedIconStyle}
      />

      <View className="flex-1 justify-center items-center px-6 pt-20 pb-10">
        
        {/* Icon Container */}
        <Animated.View 
          className="w-40 h-40 rounded-full bg-dark-card/50 items-center justify-center border border-dark-border mb-12 shadow-2xl"
          style={animatedIconStyle}
        >
          <SymbolView 
            name={ONBOARDING_DATA[currentIndex].icon as any} 
            size={64} 
            tintColor="#3b82f6" 
          />
        </Animated.View>

        {/* Text Content */}
        <View className="items-center h-32 w-full">
          <Text className="text-white text-4xl font-extrabold mb-4 text-center">
            {ONBOARDING_DATA[currentIndex].title}
          </Text>
          <Text className="text-dark-muted text-base text-center leading-relaxed px-4">
            {ONBOARDING_DATA[currentIndex].description}
          </Text>
        </View>

        {/* Pagination Dots */}
        <View className="flex-row gap-2 mt-8 mb-auto">
          {ONBOARDING_DATA.map((_, index) => {
            const isDotActive = currentIndex === index;
            return (
              <View
                key={index}
                className={`h-2 rounded-full transition-all duration-300 ${
                  isDotActive ? 'w-8 bg-primary-500' : 'w-2 bg-dark-border'
                }`}
              />
            );
          })}
        </View>

        {/* Action Button */}
        <Pressable
          className="w-full bg-primary-600 rounded-2xl py-4 items-center flex-row justify-center active:opacity-70 mt-8"
          onPress={handleNext}
        >
          <Text className="text-white font-bold text-lg">
            {currentIndex === ONBOARDING_DATA.length - 1 ? 'Mulai Sekarang' : 'Selanjutnya'}
          </Text>
          <SymbolView 
            name={currentIndex === ONBOARDING_DATA.length - 1 ? 'rocket.fill' : 'chevron.right'} 
            size={20} 
            tintColor="#fff" 
            style={{ marginLeft: 8 }} 
          />
        </Pressable>
      </View>
    </View>
  );
}
