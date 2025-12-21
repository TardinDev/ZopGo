import React from 'react';
import { ScrollView, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface TypeFilterProps {
    types: string[];
    selectedType: string;
    onTypeChange: (type: string) => void;
}

export function TypeFilter({ types, selectedType, onTypeChange }: TypeFilterProps) {
    return (
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.container}
            style={styles.scroll}>
            {types.map((type) => {
                const isActive = selectedType === type;
                return (
                    <TouchableOpacity
                        key={type}
                        activeOpacity={0.9}
                        onPress={() => onTypeChange(type)}
                        style={[styles.filter, isActive && styles.activeFilter]}>
                        <Text style={[styles.filterText, isActive && styles.activeFilterText]}>
                            {type}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    scroll: {
        maxHeight: 60,
        marginBottom: 8,
    },
    container: {
        paddingHorizontal: 20,
        paddingVertical: 6,
        marginBottom: 8,
    },
    filter: {
        paddingHorizontal: 20,
        height: 36,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 20,
        marginRight: 12,
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
    },
    activeFilter: {
        backgroundColor: 'white',
    },
    filterText: {
        color: 'white',
        fontWeight: '700',
        fontSize: 16,
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    activeFilterText: {
        color: '#2563EB',
        textShadowColor: 'transparent',
    },
});
