import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { LogoutSheet } from '../LogoutSheet';

function setup(overrides: Partial<React.ComponentProps<typeof LogoutSheet>> = {}) {
  const defaultProps: React.ComponentProps<typeof LogoutSheet> = {
    visible: true,
    onClose: jest.fn(),
    currentRole: 'client',
    availableRoles: ['client', 'chauffeur'],
    onSwitchRole: jest.fn(),
    onLogout: jest.fn(),
  };
  const props = { ...defaultProps, ...overrides };
  const utils = render(<LogoutSheet {...props} />);
  return { ...utils, props };
}

describe('LogoutSheet', () => {
  describe('rendering', () => {
    it('renders the title prompt', () => {
      const { getByText } = setup();
      expect(getByText('Que veux-tu faire ?')).toBeTruthy();
    });

    it('always shows the destructive "Se déconnecter" row', () => {
      const { getByText } = setup({ availableRoles: ['client'] });
      expect(getByText('Se déconnecter')).toBeTruthy();
    });

    it('shows the switch-mode section when the user has multiple roles', () => {
      const { getByText } = setup({
        currentRole: 'client',
        availableRoles: ['client', 'chauffeur'],
      });
      expect(getByText('BASCULER VERS UN AUTRE MODE')).toBeTruthy();
      expect(getByText('Transporteur')).toBeTruthy();
    });

    it('hides the switch-mode section when the user has a single role', () => {
      const { queryByText } = setup({
        currentRole: 'client',
        availableRoles: ['client'],
      });
      expect(queryByText('BASCULER VERS UN AUTRE MODE')).toBeNull();
      expect(queryByText('Transporteur')).toBeNull();
      expect(queryByText('Hébergeur')).toBeNull();
    });

    it('excludes the current role from the switch options', () => {
      const { queryByText, getByText } = setup({
        currentRole: 'chauffeur',
        availableRoles: ['client', 'chauffeur', 'hebergeur'],
      });
      // Current role must not appear as a switchable target.
      expect(queryByText('Transporteur')).toBeNull();
      // Other granted roles must appear.
      expect(getByText('Client')).toBeTruthy();
      expect(getByText('Hébergeur')).toBeTruthy();
    });

    it('renders the "no re-auth" reassurance subtitle on switch rows', () => {
      const { getAllByText } = setup({
        currentRole: 'client',
        availableRoles: ['client', 'chauffeur', 'hebergeur'],
      });
      // Two switch rows, both with the same subtitle.
      expect(getAllByText('Bascule sans te reconnecter')).toHaveLength(2);
    });
  });

  describe('callbacks', () => {
    it('calls onSwitchRole with the tapped role', () => {
      const onSwitchRole = jest.fn();
      const { getByText } = setup({
        currentRole: 'client',
        availableRoles: ['client', 'chauffeur'],
        onSwitchRole,
      });
      fireEvent.press(getByText('Transporteur'));
      expect(onSwitchRole).toHaveBeenCalledWith('chauffeur');
    });

    it('calls onLogout when the destructive row is tapped', () => {
      const onLogout = jest.fn();
      const { getByText } = setup({ onLogout });
      fireEvent.press(getByText('Se déconnecter'));
      expect(onLogout).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when the X button is tapped', () => {
      const onClose = jest.fn();
      const { getByLabelText } = setup({ onClose });
      fireEvent.press(getByLabelText('Fermer'));
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('does NOT trigger logout when the user only taps a switch row', () => {
      const onLogout = jest.fn();
      const onSwitchRole = jest.fn();
      const { getByText } = setup({
        currentRole: 'client',
        availableRoles: ['client', 'hebergeur'],
        onSwitchRole,
        onLogout,
      });
      fireEvent.press(getByText('Hébergeur'));
      expect(onSwitchRole).toHaveBeenCalledTimes(1);
      expect(onLogout).not.toHaveBeenCalled();
    });
  });
});
