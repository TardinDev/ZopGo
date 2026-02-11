import { Redirect } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { View, ActivityIndicator } from 'react-native';

export default function Index() {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#2162FE" />
      </View>
    );
  }

  if (isSignedIn) {
    return <Redirect href="/(protected)/(tabs)" />;
  }

  return <Redirect href="/onboarding" />;
}
