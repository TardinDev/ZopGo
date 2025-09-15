import { useEffect } from 'react';
import { Image } from 'react-native';
import { router } from 'expo-router';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

export default function SplashScreen() {
  useEffect(() => {
    const timeout = setTimeout(() => {
      router.replace('/home');
    }, 5000);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <LinearGradient
      colors={['#4FA5CF', '#FCA91A']}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      className="absolute z-0">
      <BlurView intensity={20} tint="light" className="absolute z-10" />

      <Image
        source={require('../../assets/zopgopro.jpeg')}
        className="h-full w-full"
        resizeMode="contain"
      />
    </LinearGradient>
  );
}
