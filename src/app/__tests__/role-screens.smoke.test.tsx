// QA smoke tests — parcours par rôle (/qa du 2026-07-08).
// Rend les écrans principaux de chaque rôle avec un utilisateur seedé dans
// authStore, comme au premier affichage après connexion. Garantit qu'aucun
// écran de rôle ne crashe au montage (le simulateur iOS local étant
// indisponible, ces rendus RTL sont la couverture "utilisateur réel" native).

import React from 'react';
import { render } from '@testing-library/react-native';

const mockPush = jest.fn();
const mockBack = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, back: mockBack, replace: jest.fn() }),
  router: { push: mockPush, back: mockBack, replace: jest.fn() },
  useLocalSearchParams: () => ({}),
}));

jest.mock('@react-navigation/native', () => ({
  useFocusEffect: jest.fn(),
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn().mockResolvedValue(undefined),
  notificationAsync: jest.fn().mockResolvedValue(undefined),
  selectionAsync: jest.fn().mockResolvedValue(undefined),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
  NotificationFeedbackType: { Success: 'success', Error: 'error', Warning: 'warning' },
}));

jest.mock('../../hooks/useSupabaseSubscription', () => ({
  useSupabaseSubscription: jest.fn(),
}));

import { TabAnimationProvider } from '../../hooks/useTabAnimation';
import { useAuthStore } from '../../stores/authStore';
import VoyagesScreen from '../(protected)/(tabs)/voyages';
import TrajetsScreen from '../(protected)/(tabs)/trajets';
import MesHebergementsScreen from '../(protected)/(tabs)/mes-hebergements';

const renderInTabs = (ui: React.ReactElement) =>
  render(<TabAnimationProvider>{ui}</TabAnimationProvider>);

const seedRole = (role: 'client' | 'chauffeur' | 'hebergeur') => {
  useAuthStore.getState().setupProfile(
    role,
    `QA ${role}`,
    `qa.${role}@test.com`,
    role === 'chauffeur' ? 'voiture' : undefined,
    undefined,
    role === 'hebergeur' ? 'hotel' : undefined
  );
  useAuthStore.setState({ supabaseProfileId: `supa_${role}` });
};

beforeEach(() => {
  jest.clearAllMocks();
  useAuthStore.setState({ user: null, clerkId: null, supabaseProfileId: null });
});

describe('Écrans par rôle — rendu au premier affichage', () => {
  it('client : Voyages rend la recherche sans crash', () => {
    seedRole('client');
    const { getByText } = renderInTabs(<VoyagesScreen />);
    expect(getByText('Trouvez votre voyage')).toBeTruthy();
  });

  it('chauffeur : Mes trajets rend le tableau de bord sans crash', () => {
    seedRole('chauffeur');
    const { getByText } = renderInTabs(<TrajetsScreen />);
    expect(getByText('Mes trajets')).toBeTruthy();
  });

  it('hébergeur : Mes logements rend la gestion sans crash', () => {
    seedRole('hebergeur');
    const { getByText } = renderInTabs(<MesHebergementsScreen />);
    expect(getByText('Mes logements')).toBeTruthy();
  });
});
