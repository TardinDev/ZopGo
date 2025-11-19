import React, { Component, ReactNode } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * Error Boundary pour capturer les erreurs React
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log l'erreur (à remplacer par un service de tracking en production)
    console.error('Error caught by boundary:', error, errorInfo);

    // TODO: Envoyer à un service de tracking d'erreurs (Sentry, etc.)
    // Sentry.captureException(error, { extra: errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View className="flex-1 items-center justify-center bg-gray-50 px-6">
          <View className="items-center">
            <View
              className="mb-6 h-24 w-24 items-center justify-center rounded-full"
              style={{ backgroundColor: `${COLORS.error}20` }}
            >
              <Ionicons name="alert-circle" size={64} color={COLORS.error} />
            </View>

            <Text className="text-center text-2xl font-bold text-gray-800">
              Une erreur est survenue
            </Text>

            <Text className="mt-3 text-center text-base text-gray-600 px-8">
              Nous sommes désolés, quelque chose s'est mal passé.
              Veuillez réessayer ou contacter le support si le problème persiste.
            </Text>

            {__DEV__ && this.state.error && (
              <View className="mt-4 w-full rounded-xl bg-red-50 p-4 border border-red-200">
                <Text className="text-xs text-red-800 font-mono">
                  {this.state.error.message}
                </Text>
              </View>
            )}

            <TouchableOpacity
              onPress={this.handleReset}
              className="mt-8 rounded-2xl px-8 py-4"
              style={{ backgroundColor: COLORS.primary }}
            >
              <Text className="font-bold text-white text-base">Réessayer</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}
