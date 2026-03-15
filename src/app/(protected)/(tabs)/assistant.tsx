export { RouteErrorBoundary as ErrorBoundary } from '../../../components/RouteErrorBoundary';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../../../constants';
import { AnimatedTabScreen } from '../../../components/ui';
import { ChatScreen } from '../../../components/chat';

export default function AssistantTab() {
  return (
    <AnimatedTabScreen>
      <LinearGradient colors={COLORS.gradients.primary} style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1 }}>
          <ChatScreen />
        </SafeAreaView>
      </LinearGradient>
    </AnimatedTabScreen>
  );
}
