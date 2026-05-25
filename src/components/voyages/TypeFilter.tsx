import React from 'react';
import { ScrollView, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { COLORS } from '../../constants';

interface TypeFilterProps {
  types: string[];
  selectedType: string;
  onTypeChange: (type: string) => void;
}

interface TypeTheme {
  emoji: string;
  label: string;
  // Étiquette d'accessibilité (différente du label visible pour "All").
  a11y: string;
}

const TYPE_THEME: Record<string, TypeTheme> = {
  All:     { emoji: '🌍', label: 'Tout',    a11y: 'Toutes les catégories' },
  Taxi:    { emoji: '🚕', label: 'Taxi',    a11y: 'Taxi' },
  Voiture: { emoji: '🚙', label: 'Voiture', a11y: 'Voiture' },
  Bus:     { emoji: '🚌', label: 'Bus',     a11y: 'Bus' },
  Train:   { emoji: '🚆', label: 'Train',   a11y: 'Train' },
  Avion:   { emoji: '✈️', label: 'Avion',   a11y: 'Avion' },
  Bateaux: { emoji: '🚢', label: 'Bateaux', a11y: 'Bateaux' },
};

const FALLBACK: TypeTheme = { emoji: '❓', label: '—', a11y: 'Inconnu' };

export function TypeFilter({ types, selectedType, onTypeChange }: TypeFilterProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
      style={styles.scroll}>
      {types.map((type) => {
        const isActive = selectedType === type;
        const theme = TYPE_THEME[type] ?? FALLBACK;
        return (
          <TouchableOpacity
            key={type}
            activeOpacity={0.85}
            onPress={() => onTypeChange(type)}
            style={[styles.chip, isActive ? styles.activeChip : styles.inactiveChip]}
            accessibilityRole="button"
            accessibilityLabel={theme.a11y}
            accessibilityState={{ selected: isActive }}>
            <Text style={styles.emoji}>{theme.emoji}</Text>
            <Text
              style={[styles.label, isActive ? styles.labelActive : styles.labelInactive]}
              numberOfLines={1}>
              {theme.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    maxHeight: 88,
    marginBottom: 4,
  },
  container: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginBottom: 4,
    gap: 10,
  },
  chip: {
    width: 72,
    height: 72,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    paddingVertical: 8,
    gap: 2,
  },
  inactiveChip: {
    backgroundColor: 'rgba(0, 0, 0, 0.22)',
  },
  activeChip: {
    backgroundColor: 'white',
    transform: [{ scale: 1.06 }],
    borderWidth: 2,
    borderColor: COLORS.primary,
    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.18)',
  },
  emoji: {
    fontSize: Platform.OS === 'ios' ? 26 : 24,
    lineHeight: Platform.OS === 'ios' ? 30 : 28,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
  },
  labelInactive: {
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.25)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  labelActive: {
    color: COLORS.primary,
  },
});
