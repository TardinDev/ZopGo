import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { weatherInfo } from '../../data';

export function WeatherWidget() {
  return (
    <View style={styles.container}>
      {/* En-tête de section avec météo */}
      <View style={styles.card}>
        <View style={styles.leftContent}>
          <Text style={styles.icon}>{weatherInfo.icon}</Text>
          <View>
            <Text style={styles.temp}>{weatherInfo.temperature}</Text>
            <Text style={styles.location}>{weatherInfo.location}</Text>
          </View>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{weatherInfo.condition}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    fontSize: 30, // text-3xl
    marginRight: 8,
  },
  temp: {
    fontSize: 20, // text-xl
    fontWeight: 'bold',
    color: 'white',
  },
  location: {
    fontSize: 12, // text-xs
    color: 'rgba(255, 255, 255, 0.8)',
  },
  badge: {
    borderRadius: 9999, // rounded-full
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 12, // text-xs
    fontWeight: '600',
    color: 'white',
  },
});
