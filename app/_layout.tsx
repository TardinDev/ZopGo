import '../global.css';

import { Stack } from 'expo-router';

<<<<<<< HEAD
export default function Layout() {
  return <Stack />;
=======
export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
    </Stack>
  );
>>>>>>> 5115cf2 (Initial commit)
}
