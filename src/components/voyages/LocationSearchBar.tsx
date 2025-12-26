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
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  input: {
    marginLeft: 12,
    flex: 1,
    color: '#1F2937',
  },
});
