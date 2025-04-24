import { useEffect } from 'react';
import { View,Text, Image, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { BlurView } from 'expo-blur';

export default function SplashScreen() {
  useEffect(() => {
    const timeout = setTimeout(() => {
      router.replace('/home');
    }, 3000);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <View className="flex-1 relative bg-white">   
      <Image
          source={require('../assets/newzopgo.png')}
          className="w-full h-full "
          resizeMode="cover"
        />
    </View>
  );
}
