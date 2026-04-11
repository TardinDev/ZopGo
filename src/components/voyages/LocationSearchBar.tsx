import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface LocationSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function LocationSearchBar({
  value,
  onChange,
  placeholder = 'Rechercher une ville',
}: LocationSearchBarProps) {
  return (
    <View style={styles.container}>
      <Ionicons name="search" size={20} color="#4facfe" />
      <TextInput
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        value={value}
        onChangeText={onChange}
        style={styles.input}
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={() => onChange('')}>
          <Ionicons name="close-circle" size={20} color="#9CA3AF" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    borderCurve: 'continuous',
    paddingHorizontal: 16,
    paddingVertical: 12,
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.10)',
  },
  input: {
    marginLeft: 12,
    flex: 1,
    color: '#1F2937',
  },
});
