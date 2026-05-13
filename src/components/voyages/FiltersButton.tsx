import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../constants';

interface FiltersButtonProps {
  onPress: () => void;
  count: number;
}

export function FiltersButton({ onPress, count }: FiltersButtonProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={styles.button}
      accessibilityRole="button"
      accessibilityLabel={
        count > 0
          ? `Ouvrir les filtres, ${count} filtre${count > 1 ? 's' : ''} actif${count > 1 ? 's' : ''}`
          : 'Ouvrir les filtres'
      }
    >
      <MaterialCommunityIcons name="tune-variant" size={18} color={COLORS.primary} />
      <Text style={styles.text}>Filtres</Text>
      {count > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{count}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'white',
    gap: 6,
  },
  text: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
  badge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    marginLeft: 2,
  },
  badgeText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '700',
  },
});
