/**
 * PickerModal - Modal bottom sheet reutilisable pour selection dans une liste
 */

import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Pressable,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '~/constants/colors';

export interface PickerOption {
  value: string;
  label: string;
}

interface PickerModalProps {
  visible: boolean;
  title: string;
  options: PickerOption[];
  selectedValue?: string;
  onSelect: (value: string) => void;
  onClose: () => void;
}

export function PickerModal({
  visible,
  title,
  options,
  selectedValue,
  onSelect,
  onClose,
}: PickerModalProps) {
  const [tempValue, setTempValue] = useState<string | undefined>(selectedValue);

  useEffect(() => {
    setTempValue(selectedValue);
  }, [selectedValue, visible]);

  const handleValidate = () => {
    if (tempValue !== undefined) {
      onSelect(tempValue);
    }
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <MaterialCommunityIcons
                name="close"
                size={24}
                color={COLORS.gray[600]}
              />
            </TouchableOpacity>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={handleValidate} style={styles.validateBtn}>
              <Text style={styles.validateText}>Valider</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={options}
            keyExtractor={(item) => item.value}
            style={styles.list}
            renderItem={({ item }) => {
              const isSelected = tempValue === item.value;
              return (
                <TouchableOpacity
                  style={[
                    styles.option,
                    isSelected && styles.optionSelected,
                  ]}
                  onPress={() => setTempValue(item.value)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      isSelected && styles.optionTextSelected,
                    ]}
                  >
                    {item.label}
                  </Text>
                  {isSelected && (
                    <MaterialCommunityIcons
                      name="check"
                      size={22}
                      color={COLORS.white}
                    />
                  )}
                </TouchableOpacity>
              );
            }}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: 400,
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  closeBtn: {
    padding: 8,
    width: 40,
  },
  title: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.gray[900],
    textAlign: 'center',
  },
  validateBtn: {
    padding: 8,
    width: 72,
    alignItems: 'flex-end',
  },
  validateText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primary,
  },
  list: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    marginVertical: 4,
    backgroundColor: COLORS.gray[50],
  },
  optionSelected: {
    backgroundColor: COLORS.primary,
  },
  optionText: {
    fontSize: 15,
    color: COLORS.gray[800],
    fontWeight: '500',
  },
  optionTextSelected: {
    color: COLORS.white,
    fontWeight: '700',
  },
});
