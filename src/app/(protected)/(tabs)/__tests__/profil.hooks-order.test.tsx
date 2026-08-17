// Regression guard — hooks conditionnels dans l'onglet Profil.
//
// `useState` pour l'avatar était appelé APRÈS le `if (!profile) return null`.
// Tant que le profil existe, l'écran rend 6 hooks ; dès qu'il devient nul —
// logout, changement de rôle — le return anticipé en coupe deux et React lève
// « Rendered fewer hooks than expected ». Le crash frappe le chemin le plus
// banal qui soit : se déconnecter depuis l'onglet Profil.
//
// Ce test reproduit exactement cette transition.

import React from 'react';
import { act, render } from '@testing-library/react-native';

const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, back: jest.fn(), replace: jest.fn() }),
  router: { push: mockPush, back: jest.fn(), replace: jest.fn() },
  useLocalSearchParams: () => ({}),
}));

jest.mock('@react-navigation/native', () => ({
  useFocusEffect: jest.fn(),
}));

jest.mock('expo-image-picker', () => ({
  requestCameraPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  requestMediaLibraryPermissionsAsync: jest
    .fn()
    .mockResolvedValue({ status: 'granted' }),
  launchCameraAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
}));

import { TabAnimationProvider } from '../../../../hooks/useTabAnimation';
import { useAuthStore } from '../../../../stores/authStore';
import ProfilTab from '../profil';

const renderInTabs = (ui: React.ReactElement) =>
  render(<TabAnimationProvider>{ui}</TabAnimationProvider>);

beforeEach(() => {
  jest.clearAllMocks();
  useAuthStore.setState({ user: null, clerkId: null, supabaseProfileId: null });
});

describe('Onglet Profil — ordre des hooks stable', () => {
  it('ne crashe pas quand le profil disparaît entre deux rendus (logout)', () => {
    useAuthStore
      .getState()
      .setupProfile('client', 'QA client', 'qa.client@test.com');
    useAuthStore.setState({ supabaseProfileId: 'supa_client' });

    renderInTabs(<ProfilTab />);

    // Logout : le profil disparaît du store alors que l'écran est monté. Le
    // re-render déclenché ici est celui qui plante si les hooks passent sous
    // le return anticipé — d'où le act() qui le rend synchrone.
    expect(() =>
      act(() => {
        useAuthStore.setState({
          user: null,
          clerkId: null,
          supabaseProfileId: null,
        });
      })
    ).not.toThrow();
  });

  it('rend sans crash quand le profil est absent dès le premier rendu', () => {
    expect(() => renderInTabs(<ProfilTab />)).not.toThrow();
  });

  it('rend le profil quand il est présent', () => {
    useAuthStore
      .getState()
      .setupProfile('client', 'QA client', 'qa.client@test.com');
    useAuthStore.setState({ supabaseProfileId: 'supa_client' });

    const { getByLabelText } = renderInTabs(<ProfilTab />);

    expect(getByLabelText('Changer la photo de profil')).toBeTruthy();
  });
});
