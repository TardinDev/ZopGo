import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { UserRole } from '../../types';

interface WelcomeMessageProps {
  userRole: UserRole;
  userName: string;
  onSuggestionPress: (text: string) => void;
}

const SUGGESTIONS: Record<UserRole, string[]> = {
  client: [
    'Comment réserver un voyage ?',
    'Comment suivre ma livraison ?',
    'Quels hébergements sont disponibles ?',
  ],
  chauffeur: [
    'Comment créer un nouveau trajet ?',
    'Comment augmenter ma note ?',
    'Comment voir mes revenus ?',
  ],
  hebergeur: [
    'Comment ajouter une annonce ?',
    'Comment fixer mes tarifs ?',
    'Comment gérer mes réservations ?',
  ],
};

const WELCOME_TEXT: Record<UserRole, string> = {
  client: 'Je peux vous aider à réserver des voyages, suivre vos livraisons, trouver des hébergements et bien plus.',
  chauffeur: 'Je peux vous aider à gérer vos trajets, optimiser vos revenus et améliorer votre profil.',
  hebergeur: 'Je peux vous aider à gérer vos annonces, optimiser vos tarifs et améliorer vos avis.',
};

export function WelcomeMessage({ userRole, userName, onSuggestionPress }: WelcomeMessageProps) {
  const firstName = userName.split(' ')[0];
  const suggestions = SUGGESTIONS[userRole];
  const welcomeText = WELCOME_TEXT[userRole];

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <MaterialCommunityIcons name="robot-happy-outline" size={48} color="#2162FE" />
      </View>

      <Text style={styles.greeting}>Bonjour {firstName} !</Text>
      <Text style={styles.subtitle}>
        Je suis votre assistant ZopGo.{'\n'}
        {welcomeText}
      </Text>

      <View style={styles.suggestionsContainer}>
        <Text style={styles.suggestionsTitle}>Suggestions :</Text>
        {suggestions.map((suggestion) => (
          <TouchableOpacity
            key={suggestion}
            style={styles.chip}
            onPress={() => onSuggestionPress(suggestion)}
            activeOpacity={0.7}>
            <Text style={styles.chipText}>{suggestion}</Text>
            <MaterialCommunityIcons name="arrow-right" size={16} color="#2162FE" />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 40,
    paddingBottom: 24,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(33, 98, 254, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  suggestionsContainer: {
    width: '100%',
  },
  suggestionsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9CA3AF',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 13,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  chipText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
});
