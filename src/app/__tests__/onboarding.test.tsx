import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

const mockReplace = jest.fn();

jest.mock('expo-router', () => ({
  router: {
    replace: (...args: unknown[]) => mockReplace(...args),
  },
}));

import OnboardingScreen from '../onboarding';

beforeEach(() => {
  mockReplace.mockClear();
});

describe('OnboardingScreen', () => {
  describe('initial render (step 1)', () => {
    it('shows the first gate label and headline', () => {
      const { getByText } = render(<OnboardingScreen />);
      expect(getByText('GATE A1')).toBeTruthy();
      expect(getByText('BIENVENUE')).toBeTruthy();
      expect(getByText('À BORD')).toBeTruthy();
    });

    it('uppercases the CTA label and shows the right copy per step', () => {
      const { getByText } = render(<OnboardingScreen />);
      // Step 1 cta = "Continuer" → rendered uppercase
      expect(getByText('CONTINUER')).toBeTruthy();
    });

    it('shows the Passer button on non-last steps', () => {
      const { getByText } = render(<OnboardingScreen />);
      expect(getByText('Passer')).toBeTruthy();
    });
  });

  describe('navigation', () => {
    it('advances to step 2 when the CTA is tapped on step 1', () => {
      const { getByText, queryByText } = render(<OnboardingScreen />);
      expect(queryByText('GATE A2')).toBeNull();

      fireEvent.press(getByText('CONTINUER'));

      expect(getByText('GATE A2')).toBeTruthy();
      expect(getByText('TRANSPORT')).toBeTruthy();
      expect(getByText('RAPIDE')).toBeTruthy();
    });

    it('advances through every gate and changes the CTA label on the last step', () => {
      const { getByText } = render(<OnboardingScreen />);

      // step 1 → 2
      fireEvent.press(getByText('CONTINUER'));
      expect(getByText('GATE A2')).toBeTruthy();

      // step 2 → 3 (last)
      fireEvent.press(getByText('CONTINUER'));
      expect(getByText('GATE A3')).toBeTruthy();
      // Last-step CTA copy is "Embarquer" → rendered uppercase
      expect(getByText('EMBARQUER')).toBeTruthy();
    });

    it('hides the Passer button on the last step (no escape, must commit)', () => {
      const { getByText, queryByText } = render(<OnboardingScreen />);
      fireEvent.press(getByText('CONTINUER')); // → step 2
      fireEvent.press(getByText('CONTINUER')); // → step 3
      expect(queryByText('Passer')).toBeNull();
    });

    it('routes to /auth when the CTA is pressed on the last step', () => {
      const { getByText } = render(<OnboardingScreen />);
      fireEvent.press(getByText('CONTINUER')); // step 2
      fireEvent.press(getByText('CONTINUER')); // step 3
      fireEvent.press(getByText('EMBARQUER')); // commit

      expect(mockReplace).toHaveBeenCalledTimes(1);
      expect(mockReplace).toHaveBeenCalledWith('/auth');
    });

    it('routes to /auth when Passer is tapped on a non-last step', () => {
      const { getByText } = render(<OnboardingScreen />);
      fireEvent.press(getByText('Passer'));

      expect(mockReplace).toHaveBeenCalledTimes(1);
      expect(mockReplace).toHaveBeenCalledWith('/auth');
    });
  });
});
