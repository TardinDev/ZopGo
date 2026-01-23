import { create } from 'zustand';
import { Review, RatingSummaryData } from '../types';
import { receivedReviews, givenReviews, userRatingSummary } from '../data/ratings';

interface RatingsState {
    receivedReviews: Review[];
    givenReviews: Review[];
    ratingSummary: RatingSummaryData;
    isSubmitting: boolean;

    // Actions
    addReview: (review: Omit<Review, 'id' | 'date'>) => void;
    setSubmitting: (value: boolean) => void;
}

export const useRatingsStore = create<RatingsState>((set, get) => ({
    receivedReviews: receivedReviews,
    givenReviews: givenReviews,
    ratingSummary: userRatingSummary,
    isSubmitting: false,

    addReview: (review) => {
        const newReview: Review = {
            ...review,
            id: Date.now(),
            date: new Date().toISOString().split('T')[0],
        };

        set((state) => ({
            givenReviews: [newReview, ...state.givenReviews],
        }));
    },

    setSubmitting: (value) => set({ isSubmitting: value }),
}));
