import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

const mockReplace = jest.fn();
const mockSetActive = jest.fn();
const mockSetSignUpActive = jest.fn();

jest.mock('expo-router', () => ({
  router: {
    replace: (...args: unknown[]) => mockReplace(...args),
  },
}));

jest.mock('@clerk/clerk-expo', () => ({
  useSignIn: () => ({
    signIn: { create: jest.fn() },
    setActive: mockSetActive,
    isLoaded: true,
  }),
  useSignUp: () => ({
    signUp: { create: jest.fn(), prepareEmailAddressVerification: jest.fn() },
    setActive: mockSetSignUpActive,
    isLoaded: true,
  }),
  useUser: () => ({ user: null }),
}));

// Avoid expo-haptics module init in the test runner (no native bridge).
// Methods return resolved promises so `.catch(...)` chains don't crash.
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn().mockResolvedValue(undefined),
  notificationAsync: jest.fn().mockResolvedValue(undefined),
  selectionAsync: jest.fn().mockResolvedValue(undefined),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
  NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
}));

// Skip the animated role-transition overlay in tests — it normally
// renders for ~600ms then calls onComplete. We fire onComplete synchronously
// so the new role state is applied immediately and assertions work.
jest.mock('../../components/ui', () => {
  const actual = jest.requireActual('../../components/ui');
  const React = require('react');
  return {
    ...actual,
    ModeTransition: ({ visible, onComplete }: { visible: boolean; onComplete?: () => void }) => {
      React.useEffect(() => {
        if (visible && onComplete) onComplete();
      }, [visible, onComplete]);
      return null;
    },
  };
});

import AuthScreen from '../auth';

beforeEach(() => {
  mockReplace.mockClear();
  mockSetActive.mockClear();
  mockSetSignUpActive.mockClear();
});

describe('AuthScreen — boarding-pass refresh', () => {
  it('renders the ZOPGO PASS brand strip', () => {
    const { getByText } = render(<AuthScreen />);
    expect(getByText('ZOPGO PASS')).toBeTruthy();
  });

  it("starts in login mode (brand-strip caption = 'Embarquement')", () => {
    const { getByText } = render(<AuthScreen />);
    // textTransform: 'uppercase' is a render-time CSS transform; the
    // underlying string in JSX is title-case, which is what getByText
    // matches against.
    expect(getByText('Embarquement')).toBeTruthy();
  });

  it('renders the three role pills', () => {
    const { getByText } = render(<AuthScreen />);
    expect(getByText('Client')).toBeTruthy();
    expect(getByText('Transporteur')).toBeTruthy();
    expect(getByText('Hébergeur')).toBeTruthy();
  });

  it('shows the uppercase login CTA by default', () => {
    const { getByText } = render(<AuthScreen />);
    expect(getByText('SE CONNECTER')).toBeTruthy();
  });

  it('shows the "Mot de passe oublié ?" link only in login mode', () => {
    const { getByText } = render(<AuthScreen />);
    expect(getByText('Mot de passe oublié ?')).toBeTruthy();
  });

  it("flips to signup mode when 'Créer un compte' is tapped", () => {
    const { getByText, queryByText } = render(<AuthScreen />);

    fireEvent.press(getByText('Créer un compte'));

    expect(getByText('Inscription')).toBeTruthy();
    // The CTA label is uppercased at the JS level (`.toUpperCase()`), so
    // getByText needs the uppercased string here.
    expect(getByText('CRÉER LE COMPTE')).toBeTruthy();
    // Forgot-password link is login-only and should disappear.
    expect(queryByText('Mot de passe oublié ?')).toBeNull();
  });

  it('renders the vehicle picker when Transporteur is selected', () => {
    const { getByText, queryByText } = render(<AuthScreen />);

    // Vehicle picker is hidden for client.
    expect(queryByText('Mon véhicule')).toBeNull();

    fireEvent.press(getByText('Transporteur'));

    expect(getByText('Mon véhicule')).toBeTruthy();
  });

  it("renders the accommodation picker when Hébergeur is selected", () => {
    const { getByText, queryByText } = render(<AuthScreen />);

    expect(queryByText("Type d'hébergement")).toBeNull();

    fireEvent.press(getByText('Hébergeur'));

    expect(getByText("Type d'hébergement")).toBeTruthy();
  });
});
