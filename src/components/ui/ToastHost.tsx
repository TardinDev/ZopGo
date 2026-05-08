import { useEffect } from 'react';
import { View, Text, Pressable, Platform } from 'react-native';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useToastStore, Toast } from '../../stores/toastStore';

const COLORS_BY_TYPE = {
  success: {
    bg: '#ECFDF5',
    border: '#A7F3D0',
    icon: '#059669',
    title: '#065F46',
    text: '#047857',
    iconName: 'checkmark-circle' as const,
  },
  error: {
    bg: '#FEF2F2',
    border: '#FECACA',
    icon: '#EF4444',
    title: '#991B1B',
    text: '#7F1D1D',
    iconName: 'sad-outline' as const,
  },
  info: {
    bg: '#EFF6FF',
    border: '#BFDBFE',
    icon: '#2162FE',
    title: '#1E40AF',
    text: '#1E3A8A',
    iconName: 'information-circle' as const,
  },
};

function ToastItem({ toast }: { toast: Toast }) {
  const dismiss = useToastStore((s) => s.dismiss);
  const c = COLORS_BY_TYPE[toast.type];

  useEffect(() => {
    const t = setTimeout(() => dismiss(toast.id), toast.durationMs);
    return () => clearTimeout(t);
  }, [toast.id, toast.durationMs, dismiss]);

  return (
    <Animated.View
      entering={FadeInDown.springify().damping(15)}
      exiting={FadeOutUp.duration(200)}
      style={{ marginBottom: 8 }}>
      <Pressable
        onPress={() => dismiss(toast.id)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: c.bg,
          borderColor: c.border,
          borderWidth: 1,
          borderRadius: 14,
          paddingHorizontal: 14,
          paddingVertical: 12,
          gap: 12,
          shadowColor: '#000',
          shadowOpacity: 0.08,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 4 },
          elevation: 4,
        }}>
        <Ionicons name={c.iconName} size={26} color={c.icon} />
        <View style={{ flex: 1 }}>
          {toast.title && (
            <Text style={{ fontWeight: '700', color: c.title, fontSize: 14 }}>
              {toast.title}
            </Text>
          )}
          <Text
            style={{
              color: c.text,
              fontSize: 13,
              marginTop: toast.title ? 2 : 0,
            }}>
            {toast.message}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

export function ToastHost() {
  const toasts = useToastStore((s) => s.toasts);
  if (toasts.length === 0) return null;
  return (
    <SafeAreaView
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'android' ? 16 : 0,
        zIndex: 9999,
        elevation: 9999,
      }}>
      <View pointerEvents="box-none">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} />
        ))}
      </View>
    </SafeAreaView>
  );
}
