import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';

interface Activity {
    id: number;
    type: string;
    title: string;
    time: string;
    price: string;
    status: string;
    icon: string;
}

interface ActivityListProps {
    activities: Activity[];
}

export function ActivityList({ activities }: ActivityListProps) {
    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Activités récentes</Text>
                <TouchableOpacity style={styles.viewAllButton}>
                    <Text style={styles.viewAllText}>Voir tout</Text>
                </TouchableOpacity>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 10 }}>
                {activities.map((activity) => (
                    <TouchableOpacity
                        key={activity.id}
                        activeOpacity={0.8}
                        style={styles.card}>
                        <View style={styles.cardContent}>
                            <View style={[styles.iconContainer, {
                                backgroundColor: activity.type === 'course' ? '#3B82F6' : '#EAB308'
                            }]}>
                                <Text style={styles.iconText}>{activity.icon}</Text>
                            </View>

                            <View style={styles.info}>
                                <Text style={styles.activityTitle}>{activity.title}</Text>
                                <Text style={styles.activityTime}>{activity.time}</Text>
                            </View>

                            <View style={styles.rightContent}>
                                <Text style={styles.price}>{activity.price} F</Text>
                                <View style={[styles.statusBadge, {
                                    backgroundColor: activity.status === 'completed' ? '#DCFCE7' : '#F3F4F6'
                                }]}>
                                    <Text style={[styles.statusText, {
                                        color: activity.status === 'completed' ? '#15803D' : '#374151'
                                    }]}>
                                        {activity.status === 'completed' ? 'Terminée' : 'En cours'}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </TouchableOpacity>
                ))}
                {/* Padding pour le bas de page */}
                <View style={{ height: 100 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        marginBottom: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    title: {
        fontSize: 20, // text-xl
        fontWeight: 'bold',
        color: 'white',
    },
    viewAllButton: {
        borderRadius: 9999,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingHorizontal: 12,
        paddingVertical: 4,
    },
    viewAllText: {
        fontSize: 12, // text-xs
        fontWeight: '600',
        color: 'white',
    },
    card: {
        marginBottom: 12,
        borderRadius: 16,
        backgroundColor: 'white',
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 4,
        overflow: 'hidden',
    },
    cardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    iconContainer: {
        marginRight: 16,
        height: 48,
        width: 48,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 12,
    },
    iconText: {
        fontSize: 24, // text-2xl
    },
    info: {
        flex: 1,
    },
    activityTitle: {
        fontSize: 16, // text-base
        fontWeight: 'bold',
        color: '#111827',
    },
    activityTime: {
        marginTop: 4,
        fontSize: 12, // text-xs
        color: '#6B7280',
    },
    rightContent: {
        alignItems: 'flex-end',
    },
    price: {
        fontSize: 16, // text-base
        fontWeight: 'bold',
        color: '#16A34A',
    },
    statusBadge: {
        marginTop: 4,
        borderRadius: 9999,
        paddingHorizontal: 8,
        paddingVertical: 2,
    },
    statusText: {
        fontSize: 12, // text-xs
        fontWeight: '600',
    },
});
