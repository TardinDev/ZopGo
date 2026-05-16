import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ActiveReservationCard } from '../ActiveReservationCard';
import type { Reservation } from '../../../types';

function res(overrides: Partial<Reservation>): Reservation {
  return {
    id: 'r-1',
    trajetId: 't-1',
    clientId: 'c-1',
    chauffeurId: 'cf-1',
    nombrePlaces: 2,
    prixTotal: 8000,
    status: 'acceptee',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
    villeDepart: 'Libreville',
    villeArrivee: 'Oyem',
    clientName: 'Alice',
    ...overrides,
  };
}

describe('next-action computation', () => {
  it('acceptee → Démarrer (start)', () => {
    const onAction = jest.fn();
    const { getByLabelText, getByText } = render(
      <ActiveReservationCard reservation={res({ status: 'acceptee' })} onAction={onAction} />
    );
    expect(getByText('Démarrer')).toBeTruthy();
    fireEvent.press(getByLabelText('Démarrer'));
    expect(onAction).toHaveBeenCalledWith('start');
  });

  it('en_route → Je suis arrivé (arrive)', () => {
    const onAction = jest.fn();
    const { getByText } = render(
      <ActiveReservationCard reservation={res({ status: 'en_route' })} onAction={onAction} />
    );
    fireEvent.press(getByText('Je suis arrivé'));
    expect(onAction).toHaveBeenCalledWith('arrive');
  });

  it('arrivee → Terminer la course (complete)', () => {
    const onAction = jest.fn();
    const { getByText } = render(
      <ActiveReservationCard reservation={res({ status: 'arrivee' })} onAction={onAction} />
    );
    fireEvent.press(getByText('Terminer la course'));
    expect(onAction).toHaveBeenCalledWith('complete');
  });

  it('terminee → no action button, shows "Course terminée"', () => {
    const onAction = jest.fn();
    const { getByText, queryByLabelText } = render(
      <ActiveReservationCard reservation={res({ status: 'terminee' })} onAction={onAction} />
    );
    expect(getByText('Course terminée')).toBeTruthy();
    expect(queryByLabelText('Démarrer')).toBeNull();
  });
});

describe('header content', () => {
  it('shows the route from villeDepart → villeArrivee', () => {
    const { getByText } = render(
      <ActiveReservationCard reservation={res({})} onAction={jest.fn()} />
    );
    expect(getByText('Libreville → Oyem')).toBeTruthy();
  });

  it('falls back to "—" when cities are missing', () => {
    const { getByText } = render(
      <ActiveReservationCard
        reservation={res({ villeDepart: undefined, villeArrivee: undefined })}
        onAction={jest.fn()}
      />
    );
    expect(getByText('—')).toBeTruthy();
  });

  it('pluralises "places" based on nombrePlaces', () => {
    const { getByText, rerender } = render(
      <ActiveReservationCard reservation={res({ nombrePlaces: 1 })} onAction={jest.fn()} />
    );
    expect(getByText(/Alice · 1 place$/)).toBeTruthy();

    rerender(
      <ActiveReservationCard reservation={res({ nombrePlaces: 3 })} onAction={jest.fn()} />
    );
    expect(getByText(/Alice · 3 places$/)).toBeTruthy();
  });

  it('defaults clientName to "Client" when undefined', () => {
    const { getByText } = render(
      <ActiveReservationCard
        reservation={res({ clientName: undefined })}
        onAction={jest.fn()}
      />
    );
    expect(getByText(/Client ·/)).toBeTruthy();
  });

  it('shows the status pill for each acceptee/en_route/arrivee state', () => {
    const { getByText, rerender } = render(
      <ActiveReservationCard reservation={res({ status: 'acceptee' })} onAction={jest.fn()} />
    );
    expect(getByText('Acceptée')).toBeTruthy();

    rerender(
      <ActiveReservationCard reservation={res({ status: 'en_route' })} onAction={jest.fn()} />
    );
    expect(getByText('En route')).toBeTruthy();

    rerender(
      <ActiveReservationCard reservation={res({ status: 'arrivee' })} onAction={jest.fn()} />
    );
    expect(getByText('Arrivé')).toBeTruthy();
  });
});

describe('busy state', () => {
  it('disables the action button when busy=true', () => {
    const onAction = jest.fn();
    const { getByLabelText } = render(
      <ActiveReservationCard reservation={res({})} onAction={onAction} busy />
    );
    const btn = getByLabelText('Démarrer');
    fireEvent.press(btn);
    // disabled prop should block the press
    expect(onAction).not.toHaveBeenCalled();
  });
});
