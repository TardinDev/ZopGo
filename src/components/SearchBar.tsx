import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SearchBarProps {
  placeholder?: string;
  onSearch?: (text: string) => void;
}

export default function SearchBar({ placeholder = 'Rechercher...', onSearch }: SearchBarProps) {
  const [searchText, setSearchText] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleSearch = () => {
    if (onSearch) {
      onSearch(searchText);
    }
  };

  return (
    <View className="flex-row items-center rounded-full bg-white/90 px-4 py-3 shadow-md">
      <Ionicons name="search" size={20} color={isFocused ? '#3B82F6' : '#6B7280'} />
      <TextInput
        placeholder={placeholder}
        value={searchText}
        onChangeText={setSearchText}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onSubmitEditing={handleSearch}
        className="ml-3 flex-1 text-gray-800"
        placeholderTextColor="#9CA3AF"
      />
      {searchText.length > 0 && (
        <TouchableOpacity onPress={handleSearch} className="ml-2 rounded-full bg-blue-500 p-2">
          <Ionicons name="arrow-forward" size={14} color="white" />
        </TouchableOpacity>
      )}
    </View>
  );
}
