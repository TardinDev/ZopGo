import { Stack } from 'expo-router';

export default function ProtectedLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="course" options={{ headerShown: false }} />
      <Stack.Screen name="delivery" options={{ headerShown: false }} />
      <Stack.Screen name="message" options={{ headerShown: false }} />
      <Stack.Screen name="profile" options={{ headerShown: false }} />
    </Stack>
  );
}