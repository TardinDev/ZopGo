import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import {
  useSharedValue,
  withSpring,
  withSequence,
  withTiming,
  SharedValue,
  Easing,
} from 'react-native-reanimated';

// Configuration du spring pour une animation fluide et élégante
const SPRING_CONFIG = {
  damping: 18,
  stiffness: 120,
  mass: 0.8,
};

// Ordre des tabs pour déterminer la direction
const TAB_ORDER = ['index', 'voyages', 'livraisons', 'location', 'messages', 'profil'];

interface TabAnimationContextType {
  scale: SharedValue<number>;
  opacity: SharedValue<number>;
  navigateToTab: (tabName: string) => void;
  currentTab: string;
}

const TabAnimationContext = createContext<TabAnimationContextType | null>(null);

export function TabAnimationProvider({ children }: { children: ReactNode }) {
  const [currentTab, setCurrentTab] = useState('index');
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const navigateToTab = useCallback(
    (tabName: string) => {
      const currentIndex = TAB_ORDER.indexOf(currentTab);
      const nextIndex = TAB_ORDER.indexOf(tabName);

      if (currentIndex === nextIndex) return;

      // Animation Scale + Fade moderne
      // L'écran commence légèrement zoomé et transparent, puis revient à la normale
      scale.value = withSequence(
        withTiming(0.92, { duration: 0 }), // Départ légèrement réduit
        withSpring(1, SPRING_CONFIG) // Zoom vers taille normale
      );

      opacity.value = withSequence(
        withTiming(0, { duration: 0 }), // Départ transparent
        withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) }) // Fade in fluide
      );

      setCurrentTab(tabName);
    },
    [currentTab, scale, opacity]
  );

  return (
    <TabAnimationContext.Provider value={{ scale, opacity, navigateToTab, currentTab }}>
      {children}
    </TabAnimationContext.Provider>
  );
}

export function useTabAnimation() {
  const context = useContext(TabAnimationContext);
  if (!context) {
    throw new Error('useTabAnimation must be used within a TabAnimationProvider');
  }
  return context;
}
