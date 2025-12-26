import { Stack } from 'expo-router';
import { TabAnimationProvider } from '../../hooks/useTabAnimation';

export default function ProtectedLayout() {
  return (
    <TabAnimationProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </TabAnimationProvider>
  );
}
