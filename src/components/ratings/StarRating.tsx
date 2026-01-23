import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withSequence,
} from 'react-native-reanimated';

interface StarRatingProps {
    rating: number;
    maxStars?: number;
    size?: number;
    color?: string;
    editable?: boolean;
    onRatingChange?: (rating: number) => void;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export function StarRating({
    rating,
    maxStars = 5,
    size = 24,
    color = '#FFD700',
    editable = false,
    onRatingChange,
}: StarRatingProps) {
    const scales = Array.from({ length: maxStars }, () => useSharedValue(1));

    const handlePress = (index: number) => {
        if (!editable) return;

        // Animation de rebond
        scales[index].value = withSequence(
            withSpring(1.3, { damping: 10, stiffness: 400 }),
            withSpring(1, { damping: 10, stiffness: 400 })
        );

        onRatingChange?.(index + 1);
    };

    return (
        <View style={styles.container}>
            {Array.from({ length: maxStars }, (_, index) => {
                const isFilled = index < rating;
                const isHalf = index === Math.floor(rating) && rating % 1 >= 0.5;

                const animatedStyle = useAnimatedStyle(() => ({
                    transform: [{ scale: scales[index].value }],
                }));

                return (
                    <AnimatedTouchable
                        key={index}
                        onPress={() => handlePress(index)}
                        disabled={!editable}
                        activeOpacity={editable ? 0.7 : 1}
                        style={[styles.star, animatedStyle]}>
                        <Ionicons
                            name={isFilled ? 'star' : isHalf ? 'star-half' : 'star-outline'}
                            size={size}
                            color={isFilled || isHalf ? color : '#D1D5DB'}
                        />
                    </AnimatedTouchable>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    star: {
        padding: 2,
    },
});
