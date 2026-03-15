import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Sentry from '@sentry/react-native';
import { COLORS } from '../constants';

/**
 * Route-level ErrorBoundary for Expo Router.
 *
 * Usage: export { RouteErrorBoundary as ErrorBoundary } from '...'
 * in any route file to catch errors within that screen only.
 */
export function RouteErrorBoundary({ error, retry }: { error: Error; retry: () => void }) {
  // Report to Sentry
  React.useEffect(() => {
    Sentry.captureException(error, { extra: { context: 'RouteErrorBoundary' } });
  }, [error]);

  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Ionicons name="warning-outline" size={48} color={COLORS.error} />
      </View>
      <Text style={styles.title}>Oups, une erreur est survenue</Text>
      <Text style={styles.message}>
        Cette section a rencontré un problème.{'\n'}Vous pouvez réessayer ou revenir en arrière.
      </Text>
      {__DEV__ && (
        <View style={styles.devError}>
          <Text style={styles.devErrorText}>{error.message}</Text>
        </View>
      )}
      <TouchableOpacity
        style={styles.retryButton}
        onPress={retry}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel="Réessayer">
        <Ionicons name="refresh-outline" size={20} color="#FFFFFF" />
        <Text style={styles.retryText}>Réessayer</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 32,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.error + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  devError: {
    width: '100%',
    borderRadius: 12,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    padding: 12,
    marginBottom: 24,
  },
  devErrorText: {
    fontSize: 12,
    color: '#991B1B',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
  },
  retryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
