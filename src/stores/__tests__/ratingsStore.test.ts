import { useRatingsStore } from '../ratingsStore';

beforeEach(() => {
  useRatingsStore.setState({
    receivedReviews: [],
    givenReviews: [],
    ratingSummary: {
      average: 0,
      total: 0,
      distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    },
    isSubmitting: false,
  });
});

describe('ratingsStore', () => {
  describe('initial state', () => {
    it('starts with empty reviews', () => {
      expect(useRatingsStore.getState().receivedReviews).toEqual([]);
      expect(useRatingsStore.getState().givenReviews).toEqual([]);
    });

    it('starts with empty rating summary', () => {
      const summary = useRatingsStore.getState().ratingSummary;
      expect(summary.average).toBe(0);
      expect(summary.total).toBe(0);
    });

    it('starts with isSubmitting false', () => {
      expect(useRatingsStore.getState().isSubmitting).toBe(false);
    });
  });

  describe('addReview', () => {
    it('adds review to givenReviews', () => {
      useRatingsStore.getState().addReview({
        rating: 5,
        comment: 'Excellent service',
        authorName: 'Jean',
        authorAvatar: 'avatar.jpg',
        tripType: 'voyage',
      });

      const reviews = useRatingsStore.getState().givenReviews;
      expect(reviews).toHaveLength(1);
      expect(reviews[0].rating).toBe(5);
      expect(reviews[0].comment).toBe('Excellent service');
      expect(reviews[0].authorName).toBe('Jean');
      expect(reviews[0].tripType).toBe('voyage');
    });

    it('auto-generates id and date', () => {
      useRatingsStore.getState().addReview({
        rating: 4,
        comment: 'Bien',
        authorName: 'Pierre',
        authorAvatar: 'avatar.jpg',
        tripType: 'livraison',
      });

      const review = useRatingsStore.getState().givenReviews[0];
      expect(review.id).toBeTruthy();
      expect(review.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('prepends new reviews', () => {
      useRatingsStore.getState().addReview({
        rating: 5,
        comment: 'First',
        authorName: 'A',
        authorAvatar: '',
        tripType: 'voyage',
      });
      useRatingsStore.getState().addReview({
        rating: 3,
        comment: 'Second',
        authorName: 'B',
        authorAvatar: '',
        tripType: 'location',
      });

      const reviews = useRatingsStore.getState().givenReviews;
      expect(reviews).toHaveLength(2);
      expect(reviews[0].comment).toBe('Second');
      expect(reviews[1].comment).toBe('First');
    });

    it('supports all trip types', () => {
      const tripTypes = ['voyage', 'livraison', 'location'] as const;
      tripTypes.forEach((tripType) => {
        useRatingsStore.getState().addReview({
          rating: 4,
          comment: `Test ${tripType}`,
          authorName: 'Test',
          authorAvatar: '',
          tripType,
        });
      });
      expect(useRatingsStore.getState().givenReviews).toHaveLength(3);
    });
  });

  describe('setSubmitting', () => {
    it('sets isSubmitting to true', () => {
      useRatingsStore.getState().setSubmitting(true);
      expect(useRatingsStore.getState().isSubmitting).toBe(true);
    });

    it('sets isSubmitting to false', () => {
      useRatingsStore.getState().setSubmitting(true);
      useRatingsStore.getState().setSubmitting(false);
      expect(useRatingsStore.getState().isSubmitting).toBe(false);
    });
  });
});
