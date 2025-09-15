import { useState } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const onboardingData = [
  {
    id: 1,
    title: 'Bienvenue sur ZopGo',
    subtitle: 'Votre solution de transport et livraison',
    description: 'Commandez facilement vos trajets et livraisons en quelques clics',
    icon: '🚗',
    color: ['#4FA5CF', '#2162FE'],
  },
  {
    id: 2,
    title: 'Transport Rapide',
    subtitle: 'Voyagez en toute sécurité',
    description: 'Des conducteurs vérifiés et des véhicules de qualité à votre service',
    icon: '⚡',
    color: ['#FCA91A', '#F59E0B'],
  },
  {
    id: 3,
    title: 'Livraison Express',
    subtitle: 'Envoyez vos colis partout',
    description: 'Service de livraison rapide et sécurisé dans toute la région',
    icon: '📦',
    color: ['#10B981', '#059669'],
  },
];

export default function OnboardingScreen() {
  const [currentStep, setCurrentStep] = useState(0);
  const currentData = onboardingData[currentStep];

  const handleNext = () => {
    if (currentStep < onboardingData.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      router.replace('/auth');
    }
  };

  const handleSkip = () => {
    router.replace('/auth');
  };

  return (
    <SafeAreaView className="flex-1">
      <LinearGradient
        colors={currentData.color as [string, string]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        className="flex-1">

        {/* Skip Button */}
        <View className="flex-row justify-end p-6">
          <TouchableOpacity onPress={handleSkip}>
            <Text className="text-white/80 text-lg">Passer</Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView className="flex-1 px-8" showsVerticalScrollIndicator={false}>
          <View className="flex-1 items-center justify-center">
            {/* Icon */}
            <View className="mb-12">
              <Text className="text-8xl text-center">{currentData.icon}</Text>
            </View>

            {/* Text Content */}
            <View className="items-center mb-16">
              <Text className="text-4xl font-bold text-white text-center mb-4">
                {currentData.title}
              </Text>
              <Text className="text-xl text-white/90 text-center mb-6">
                {currentData.subtitle}
              </Text>
              <Text className="text-lg text-white/70 text-center leading-6">
                {currentData.description}
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Bottom Section */}
        <View className="px-8 pb-12">
          {/* Pagination Dots */}
          <View className="flex-row justify-center mb-8">
            {onboardingData.map((_, index) => (
              <View
                key={index}
                className={`h-2 w-8 mx-1 rounded-full ${
                  index === currentStep ? 'bg-white' : 'bg-white/30'
                }`}
              />
            ))}
          </View>

          {/* Next Button */}
          <TouchableOpacity
            onPress={handleNext}
            className="bg-white/20 backdrop-blur rounded-2xl py-4 px-8 flex-row items-center justify-center">
            <Text className="text-white text-lg font-semibold mr-2">
              {currentStep === onboardingData.length - 1 ? 'Commencer' : 'Suivant'}
            </Text>
            <Ionicons
              name="arrow-forward"
              size={20}
              color="white"
            />
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}