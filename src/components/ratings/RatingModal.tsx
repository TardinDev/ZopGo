import React, { useState } from 'react';
import {
    View,
    Text,
    Modal,
    TouchableOpacity,
    TextInput,
    StyleSheet,
    Pressable,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StarRating } from './StarRating';
import { COLORS } from '../../constants';

interface RatingModalProps {
    visible: boolean;
    onClose: () => void;
    onSubmit: (rating: number, comment: string) => void;
    userName?: string;
    tripType?: 'voyage' | 'livraison' | 'location';
}

export function RatingModal({
    visible,
    onClose,
    onSubmit,
    userName = 'le chauffeur',
    tripType = 'voyage',
}: RatingModalProps) {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');

    const handleSubmit = () => {
        if (rating === 0) return;
        onSubmit(rating, comment);
        setRating(0);
        setComment('');
        onClose();
    };

    const getRatingLabel = (rating: number) => {
        switch (rating) {
            case 1:
                return 'Très mauvais 😞';
            case 2:
                return 'Mauvais 😕';
            case 3:
                return 'Correct 😐';
            case 4:
                return 'Bien 🙂';
            case 5:
                return 'Excellent ! 🤩';
            default:
                return 'Touchez pour noter';
        }
    };

    return (
        <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.overlay}>
                <Pressable style={styles.backdrop} onPress={onClose} />

                <View style={styles.content}>
                    {/* Handle */}
                    <View style={styles.handle} />

                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.iconCircle}>
                            <Ionicons name="star" size={32} color={COLORS.warning} />
                        </View>
                        <Text style={styles.title}>Évaluez votre expérience</Text>
                        <Text style={styles.subtitle}>Comment était votre {tripType} avec {userName} ?</Text>
                    </View>

                    {/* Stars */}
                    <View style={styles.starsContainer}>
                        <StarRating rating={rating} size={40} editable onRatingChange={setRating} />
                        <Text style={styles.ratingLabel}>{getRatingLabel(rating)}</Text>
                    </View>

                    {/* Comment Input */}
                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.textInput}
                            placeholder="Ajoutez un commentaire (optionnel)"
                            placeholderTextColor="#9CA3AF"
                            multiline
                            numberOfLines={3}
                            maxLength={200}
                            value={comment}
                            onChangeText={setComment}
                        />
                        <Text style={styles.charCount}>{comment.length}/200</Text>
                    </View>

                    {/* Buttons */}
                    <View style={styles.buttons}>
                        <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                            <Text style={styles.cancelText}>Annuler</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.submitButton, rating === 0 && styles.submitButtonDisabled]}
                            onPress={handleSubmit}
                            disabled={rating === 0}>
                            <Ionicons name="send" size={18} color="white" />
                            <Text style={styles.submitText}>Envoyer</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    content: {
        backgroundColor: 'white',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        paddingHorizontal: 24,
        paddingBottom: 40,
        paddingTop: 12,
    },
    handle: {
        width: 40,
        height: 4,
        backgroundColor: '#E5E7EB',
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 20,
    },
    header: {
        alignItems: 'center',
        marginBottom: 24,
    },
    iconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: COLORS.warning + '20',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
    },
    starsContainer: {
        alignItems: 'center',
        marginBottom: 24,
    },
    ratingLabel: {
        marginTop: 12,
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
    },
    inputContainer: {
        marginBottom: 24,
    },
    textInput: {
        backgroundColor: '#F9FAFB',
        borderRadius: 16,
        padding: 16,
        fontSize: 15,
        color: '#111827',
        minHeight: 80,
        textAlignVertical: 'top',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    charCount: {
        fontSize: 12,
        color: '#9CA3AF',
        textAlign: 'right',
        marginTop: 4,
    },
    buttons: {
        flexDirection: 'row',
        gap: 12,
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 16,
        borderRadius: 16,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
    },
    cancelText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#6B7280',
    },
    submitButton: {
        flex: 1,
        flexDirection: 'row',
        paddingVertical: 16,
        borderRadius: 16,
        backgroundColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    submitButtonDisabled: {
        backgroundColor: '#D1D5DB',
    },
    submitText: {
        fontSize: 16,
        fontWeight: '600',
        color: 'white',
    },
});
