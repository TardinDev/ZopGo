import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../constants';
import type { ChauffeurStats } from '../../lib/chauffeurStats';
import { formatFcfa } from '../../lib/chauffeurStats';

interface ChauffeurDashboardProps {
  stats: ChauffeurStats;
}

export function ChauffeurDashboard({ stats }: ChauffeurDashboardProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Stat
          icon="check-circle"
          color="#10B981"
          value={String(stats.coursesTerminees)}
          label="Courses livrées"
        />
        <Stat
          icon="cash-multiple"
          color="#2162FE"
          value={formatFcfa(stats.revenus)}
          label="Revenus"
        />
      </View>
      <View style={styles.row}>
        <Stat
          icon="star"
          color="#F59E0B"
          value={stats.noteMoyenne > 0 ? stats.noteMoyenne.toFixed(1) : '—'}
          label="Note moyenne"
        />
        <Stat
          icon="percent"
          color="#8B5CF6"
          value={`${stats.tauxAcceptationPct}%`}
          label="Acceptation"
        />
      </View>
    </View>
  );
}

interface StatProps {
  icon: string;
  color: string;
  value: string;
  label: string;
}

function Stat({ icon, color, value, label }: StatProps) {
  return (
    <View style={styles.card}>
      <View style={[styles.iconCircle, { backgroundColor: color + '20' }]}>
        <MaterialCommunityIcons name={icon as never} size={18} color={color} />
      </View>
      <Text style={styles.value} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 10,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  card: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.06)',
  },
  iconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  value: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.gray[900],
  },
  label: {
    fontSize: 11,
    color: COLORS.gray[500],
    marginTop: 1,
  },
});
