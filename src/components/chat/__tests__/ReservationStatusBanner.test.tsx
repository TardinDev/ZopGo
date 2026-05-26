import React from 'react';
import { Alert } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import { ReservationStatusBanner } from '../ReservationStatusBanner';
import type { Reservation } from '../../../types';

function res(overrides: Partial<Reservation>): Reservation {
  return {
    id: 'r-1',
    trajetId: 't-1',
    clientId: 'c-1',
    chauffeurId: 'cf-1',
    nombrePlaces: 1,
    prixTotal: 5000,
    status: 'en_attente',
    createdAt: '2026-01-01T10:00:00Z',
    updatedAt: '2026-01-01T10:00:00Z',
    villeDepart: 'Libreville',
    villeArrivee: 'Oyem',
    ...overrides,
  };
}

describe('status label mapping', () => {
  const cases: { status: Reservation['status']; label: string }[] = [
    { status: 'en_attente', label: 'En attente du transporteur' },
    { status: 'acceptee', label: 'Réservation acceptée' },
    { status: 'en_route', label: 'Transporteur en route' },
    { status: 'arrivee', label: 'Le transporteur est arrivé' },
    { status: 'terminee', label: 'Course terminée' },
    { status: 'refusee', label: 'Réservation refusée' },
    { status: 'annulee', label: 'Réservation annulée' },
    { status: 'expiree', label: 'Demande expirée' },
  ];

  it.each(cases)('shows %s label for status=$status', ({ status, label }) => {
    const { getByText } = render(
      <ReservationStatusBanner
        reservation={res({ status })}
        isClient
        onCancel={jest.fn()}
        onRate={jest.fn()}
      />
    );
    expect(getByText(label)).toBeTruthy();
  });

  it('renders the route under the label when both cities are present', () => {
    const { getByText } = render(
      <ReservationStatusBanner reservation={res({})} isClient />
    );
    expect(getByText('Libreville → Oyem')).toBeTruthy();
  });
});

describe('client CTAs', () => {
  beforeEach(() => jest.clearAllMocks());

  it('shows the "Annuler" CTA only on en_attente', () => {
    const { getByText, rerender, queryByText } = render(
      <ReservationStatusBanner
        reservation={res({ status: 'en_attente' })}
        isClient
        onCancel={jest.fn()}
      />
    );
    expect(getByText('Annuler')).toBeTruthy();

    rerender(
      <ReservationStatusBanner
        reservation={res({ status: 'acceptee' })}
        isClient
        onCancel={jest.fn()}
      />
    );
    expect(queryByText('Annuler')).toBeNull();
  });

  it('confirms via Alert before invoking onCancel', () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const onCancel = jest.fn();

    const { getByText } = render(
      <ReservationStatusBanner
        reservation={res({})}
        isClient
        onCancel={onCancel}
      />
    );
    fireEvent.press(getByText('Annuler'));

    // First call to Alert.alert: (title, message, buttons)
    expect(alertSpy).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled(); // gated by the confirmation

    // Trigger the destructive button programmatically
    const buttons = alertSpy.mock.calls[0][2] as { text: string; onPress?: () => void }[];
    const confirm = buttons.find((b) => /Annuler la résa/.test(b.text));
    confirm?.onPress?.();
    expect(onCancel).toHaveBeenCalledTimes(1);

    alertSpy.mockRestore();
  });

  it('shows the "Noter" CTA only on terminée + not yet reviewed', () => {
    const onRate = jest.fn();
    const { queryByText, rerender, getByText } = render(
      <ReservationStatusBanner
        reservation={res({ status: 'terminee', reviewed: false })}
        isClient
        onRate={onRate}
      />
    );
    expect(getByText('Noter')).toBeTruthy();
    fireEvent.press(getByText('Noter'));
    expect(onRate).toHaveBeenCalledTimes(1);

    rerender(
      <ReservationStatusBanner
        reservation={res({ status: 'terminee', reviewed: true })}
        isClient
        onRate={onRate}
      />
    );
    expect(queryByText('Noter')).toBeNull();

    rerender(
      <ReservationStatusBanner
        reservation={res({ status: 'acceptee', reviewed: false })}
        isClient
        onRate={onRate}
      />
    );
    expect(queryByText('Noter')).toBeNull();
  });
});

describe('chauffeur view — no client CTAs', () => {
  it('hides "Annuler" and "Noter" when isClient=false', () => {
    const { queryByText } = render(
      <ReservationStatusBanner
        reservation={res({ status: 'en_attente' })}
        isClient={false}
        onCancel={jest.fn()}
        onRate={jest.fn()}
      />
    );
    expect(queryByText('Annuler')).toBeNull();
    expect(queryByText('Noter')).toBeNull();
  });

  it('still shows the status label', () => {
    const { getByText } = render(
      <ReservationStatusBanner
        reservation={res({ status: 'en_route' })}
        isClient={false}
      />
    );
    expect(getByText('Transporteur en route')).toBeTruthy();
  });
});
