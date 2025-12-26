import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface Tab {
  key: string;
  label: string;
}

interface TabSelectorProps {
  tabs: Tab[];
  selectedTab: string;
  onTabChange: (tabKey: string) => void;
}

export function TabSelector({ tabs, selectedTab, onTabChange }: TabSelectorProps) {
  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const isActive = selectedTab === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            onPress={() => onTabChange(tab.key)}
            style={[styles.tab, isActive && styles.activeTab]}
            activeOpacity={0.7}>
            <Text style={[styles.tabText, isActive && styles.activeTabText]}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 25,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 25,
    backgroundColor: 'transparent',
  },
  activeTab: {
    backgroundColor: 'white',
  },
  tabText: {
    textAlign: 'center',
    fontWeight: '600',
    color: 'white',
  },
  activeTabText: {
    color: '#2563EB',
  },
});
