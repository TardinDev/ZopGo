import { create } from 'zustand';
import { Review, RatingSummaryData } from '../types';

interface RatingsState {
  receivedReviews: Review[];
  givenReviews: Review[];
  ratingSummary: RatingSummaryData;
  isSubmitting: boolean;

  // Actions
  addReview: (review: Omit<Review, 'id' | 'date'>) => void;
  setSubmitting: (value: boolean) => void;
}

const emptyRatingSummary: RatingSummaryData = {
  average: 0,
  total: 0,
  distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
};

export const useRatingsStore = create<RatingsState>((set, get) => ({
  receivedReviews: [],
  givenReviews: [],
  ratingSummary: emptyRatingSummary,
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
