import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, Dimensions, Image } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  interpolate,
  Extrapolation,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { SymbolView } from 'expo-symbols';

const { width, height } = Dimensions.get('window');

const ONBOARDING_DATA = [
  {
    title: 'Catat Lembur',
    description: 'Catat setiap aktivitas lembur Anda dengan cepat dan mudah, tanpa ada yang terlewat.',
    icon: 'calendar.badge.plus',
  },
  {
    title: 'Hitung Otomatis',
    description: 'Kalkulasi estimasi upah lembur secara instan sesuai formula standar perusahaan.',
    icon: 'function',
  },
  {
    title: 'Verifikasi Gaji',
    description: 'Bandingkan hasil hitung dengan slip gaji Anda untuk transparansi maksimal.',
    icon: 'checkmark.shield.fill',
  },
];

export default function WelcomeScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const progress = useSharedValue(0);
  const pulse = useSharedValue(1);
  const floatY1 = useSharedValue(0);
  const floatY2 = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(currentIndex, { duration: 500, easing: Easing.out(Easing.cubic) });
  }, [currentIndex, progress]);

  useEffect(() => {
    // Pulse animation for the button
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1000 }),
        withTiming(1, { duration: 1000 })
      ),
      -1,
      true
    );

    // Floating blobs
    floatY1.value = withRepeat(withTiming(-20, { duration: 3000, easing: Easing.inOut(Easing.ease) }), -1, true);
    floatY2.value = withRepeat(withTiming(20, { duration: 2500, easing: Easing.inOut(Easing.ease) }), -1, true);
  }, []);

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
      [0.6, 1, 0.6],
      Extrapolation.CLAMP
    );
    const opacity = interpolate(
      progress.value,
      [currentIndex - 1, currentIndex, currentIndex + 1],
      [0, 1, 0],
      Extrapolation.CLAMP
    );
    const translateY = interpolate(
      progress.value,
      [currentIndex - 1, currentIndex, currentIndex + 1],
      [20, 0, -20],
      Extrapolation.CLAMP
    );
    return {
      transform: [{ scale }, { translateY }],
      opacity,
    };
  });

  const animatedTextStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      progress.value,
      [currentIndex - 1, currentIndex, currentIndex + 1],
      [0, 1, 0],
      Extrapolation.CLAMP
    );
    const translateY = interpolate(
      progress.value,
      [currentIndex - 1, currentIndex, currentIndex + 1],
      [15, 0, -15],
      Extrapolation.CLAMP
    );
    return {
      transform: [{ translateY }],
      opacity,
    };
  });

  const animatedButtonScale = useAnimatedStyle(() => {
    return {
      transform: [{ scale: pulse.value }],
    };
  });

  const blob1Style = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY1.value }],
  }));

  const blob2Style = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY2.value }],
  }));

  return (
    <View className="flex-1 bg-[#020617]">
      <StatusBar style="light" />
      
      {/* Background Gradient */}
      <LinearGradient
        colors={['#0f172a', '#020617', '#020617']}
        className="absolute inset-0"
      />

      {/* Decorative Blobs */}
      <Animated.View 
        className="absolute -top-32 -left-20 w-96 h-96 rounded-full bg-primary-600/15 blur-[80px]"
        style={blob1Style}
      />
      <Animated.View 
        className="absolute top-1/3 -right-32 w-80 h-80 rounded-full bg-blue-500/10 blur-[80px]"
        style={blob2Style}
      />
      <Animated.View 
        className="absolute -bottom-20 left-10 w-64 h-64 rounded-full bg-primary-500/15 blur-[60px]"
        style={blob1Style}
      />

      <View className="flex-1 px-6 pt-20 pb-12">
        {/* Top Logo Area */}
        <View className="items-center mb-8">
          <Image 
            source={require('../../assets/images/lemburin-logo.png')} 
            style={{ width: 48, height: 48 }}
            resizeMode="contain"
          />
        </View>

        {/* Center Content */}
        <View className="flex-1 justify-center items-center mt-[-40px]">
          {/* Icon Container with Glassmorphism */}
          <Animated.View 
            className="w-48 h-48 rounded-full items-center justify-center mb-10"
            style={animatedIconStyle}
          >
            {/* Outer Glow */}
            <View className="absolute inset-0 bg-primary-500/20 rounded-full blur-xl" />
            {/* Glass Card */}
            <View className="w-40 h-40 rounded-full bg-slate-800/40 border border-slate-700/50 items-center justify-center shadow-2xl backdrop-blur-md">
              <SymbolView 
                name={ONBOARDING_DATA[currentIndex].icon as any} 
                size={72} 
                tintColor="#60a5fa" 
              />
            </View>
          </Animated.View>

          {/* Text Content */}
          <Animated.View className="items-center w-full px-2" style={animatedTextStyle}>
            <Text className="text-white text-4xl font-extrabold mb-4 text-center tracking-tight">
              {ONBOARDING_DATA[currentIndex].title}
            </Text>
            <Text className="text-slate-400 text-base text-center leading-relaxed font-medium">
              {ONBOARDING_DATA[currentIndex].description}
            </Text>
          </Animated.View>
        </View>

        {/* Bottom Section */}
        <View className="w-full">
          {/* Pagination Dots */}
          <View className="flex-row justify-center gap-3 mb-10">
            {ONBOARDING_DATA.map((_, index) => {
              const isDotActive = currentIndex === index;
              return (
                <View
                  key={index}
                  className={`h-2 rounded-full transition-all duration-500 ${
                    isDotActive ? 'w-10 bg-primary-500' : 'w-2 bg-slate-700'
                  }`}
                />
              );
            })}
          </View>

          {/* Action Button */}
          <Animated.View style={currentIndex === ONBOARDING_DATA.length - 1 ? animatedButtonScale : {}}>
            <Pressable
              className="w-full overflow-hidden rounded-2xl active:opacity-80"
              onPress={handleNext}
            >
              <LinearGradient
                colors={['#2563eb', '#1d4ed8']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="py-5 items-center flex-row justify-center"
              >
                <Text className="text-white font-bold text-lg tracking-wide">
                  {currentIndex === ONBOARDING_DATA.length - 1 ? 'Mulai Sekarang' : 'Selanjutnya'}
                </Text>
                <SymbolView 
                  name={currentIndex === ONBOARDING_DATA.length - 1 ? 'rocket.fill' : 'chevron.right'} 
                  size={20} 
                  tintColor="#fff" 
                  style={{ marginLeft: 8 }} 
                />
              </LinearGradient>
            </Pressable>
          </Animated.View>
        </View>
      </View>
    </View>
  );
}
