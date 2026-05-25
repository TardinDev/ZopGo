import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { PaymentMethodSheet } from '../PaymentMethodSheet';

function setup(overrides: Partial<React.ComponentProps<typeof PaymentMethodSheet>> = {}) {
  const defaultProps: React.ComponentProps<typeof PaymentMethodSheet> = {
    visible: true,
    onClose: jest.fn(),
    amount: 15000,
    currency: 'XAF',
    onConfirm: jest.fn(),
  };
  const props = { ...defaultProps, ...overrides };
  const utils = render(<PaymentMethodSheet {...props} />);
  return { ...utils, props };
}

describe('PaymentMethodSheet', () => {
  describe('rendering', () => {
    it('shows the three payment methods', () => {
      const { getByText } = setup();
      expect(getByText('Airtel Money')).toBeTruthy();
      expect(getByText('Moov Money')).toBeTruthy();
      expect(getByText('PayPal')).toBeTruthy();
    });

    it('renders the formatted amount in the header', () => {
      const { getByText } = setup({ amount: 25000 });
      expect(getByText(/25 000 Fcfa/)).toBeTruthy();
    });

    it('displays a disabled "Choisir une méthode" CTA when nothing is selected', () => {
      const { getByText, getByLabelText } = setup();
      expect(getByText('Choisir une méthode')).toBeTruthy();
      expect(getByLabelText('Choisir une méthode de paiement')).toBeTruthy();
    });

    it('hides the phone input until a mobile-money method is picked', () => {
      const { queryByLabelText } = setup();
      expect(queryByLabelText('Numéro de téléphone pour le paiement')).toBeNull();
    });
  });

  describe('selection', () => {
    it('shows the phone input after picking Airtel Money', () => {
      const { getByText, getByLabelText } = setup();
      fireEvent.press(getByText('Airtel Money'));
      expect(getByLabelText('Numéro de téléphone pour le paiement')).toBeTruthy();
    });

    it('shows the phone input after picking Moov Money', () => {
      const { getByText, getByLabelText } = setup();
      fireEvent.press(getByText('Moov Money'));
      expect(getByLabelText('Numéro de téléphone pour le paiement')).toBeTruthy();
    });

    it('does NOT show the phone input for PayPal', () => {
      const { getByText, queryByLabelText } = setup();
      fireEvent.press(getByText('PayPal'));
      expect(queryByLabelText('Numéro de téléphone pour le paiement')).toBeNull();
    });

    it('updates the CTA label with the amount + selected method', () => {
      const { getByText, getByLabelText } = setup({ amount: 5000 });
      fireEvent.press(getByText('Airtel Money'));
      expect(
        getByLabelText('Payer 5 000 Fcfa avec Airtel Money')
      ).toBeTruthy();
    });
  });

  describe('phone validation', () => {
    it('blocks confirmation when the phone is empty for mobile money', () => {
      const onConfirm = jest.fn();
      const { getByText, getByLabelText } = setup({ onConfirm });
      fireEvent.press(getByText('Airtel Money'));
      fireEvent.press(getByLabelText(/Payer .* avec Airtel Money/));
      expect(onConfirm).not.toHaveBeenCalled();
      expect(getByText('Numéro de téléphone invalide.')).toBeTruthy();
    });

    it('blocks confirmation when the phone is too short', () => {
      const onConfirm = jest.fn();
      const { getByText, getByLabelText } = setup({ onConfirm });
      fireEvent.press(getByText('Moov Money'));
      fireEvent.changeText(
        getByLabelText('Numéro de téléphone pour le paiement'),
        '12345' // < 8 digits
      );
      fireEvent.press(getByLabelText(/Payer .* avec Moov Money/));
      expect(onConfirm).not.toHaveBeenCalled();
    });

    it('confirms with normalized E.164 phone (adds +241 if local)', () => {
      const onConfirm = jest.fn();
      const { getByText, getByLabelText } = setup({ onConfirm });
      fireEvent.press(getByText('Airtel Money'));
      fireEvent.changeText(
        getByLabelText('Numéro de téléphone pour le paiement'),
        '06612345' // 8 digits, local form
      );
      fireEvent.press(getByLabelText(/Payer .* avec Airtel Money/));
      expect(onConfirm).toHaveBeenCalledWith({
        method: 'airtel_money',
        payerPhone: '+24106612345',
      });
    });

    it('confirms with an already-prefixed international phone as-is', () => {
      const onConfirm = jest.fn();
      const { getByText, getByLabelText } = setup({ onConfirm });
      fireEvent.press(getByText('Moov Money'));
      // The input strips the +241 prefix when displaying; type the local
      // part and it auto-prefixes on submit.
      fireEvent.changeText(
        getByLabelText('Numéro de téléphone pour le paiement'),
        '066123456'
      );
      fireEvent.press(getByLabelText(/Payer .* avec Moov Money/));
      expect(onConfirm).toHaveBeenCalledWith({
        method: 'moov_money',
        payerPhone: '+241066123456',
      });
    });

    it('confirms PayPal without sending a phone', () => {
      const onConfirm = jest.fn();
      const { getByText, getByLabelText } = setup({ onConfirm });
      fireEvent.press(getByText('PayPal'));
      fireEvent.press(getByLabelText(/Payer .* avec PayPal/));
      expect(onConfirm).toHaveBeenCalledWith({ method: 'paypal' });
    });
  });

  describe('closing', () => {
    it('calls onClose when the X is tapped', () => {
      const onClose = jest.fn();
      const { getByLabelText } = setup({ onClose });
      fireEvent.press(getByLabelText('Fermer'));
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });
});
