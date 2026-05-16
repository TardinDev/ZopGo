import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { FiltersButton } from '../FiltersButton';

describe('FiltersButton', () => {
  it('renders "Filtres" label', () => {
    const { getByText } = render(<FiltersButton onPress={jest.fn()} count={0} />);
    expect(getByText('Filtres')).toBeTruthy();
  });

  it('does not show a badge when count=0', () => {
    const { queryByText } = render(<FiltersButton onPress={jest.fn()} count={0} />);
    expect(queryByText('0')).toBeNull();
  });

  it('shows the count badge when count > 0', () => {
    const { getByText } = render(<FiltersButton onPress={jest.fn()} count={3} />);
    expect(getByText('3')).toBeTruthy();
  });

  it('calls onPress when tapped', () => {
    const onPress = jest.fn();
    const { getByText } = render(<FiltersButton onPress={onPress} count={0} />);
    fireEvent.press(getByText('Filtres'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('uses an accessibility label that includes the count for screen readers', () => {
    const { getByLabelText, rerender } = render(<FiltersButton onPress={jest.fn()} count={0} />);
    expect(getByLabelText('Ouvrir les filtres')).toBeTruthy();

    rerender(<FiltersButton onPress={jest.fn()} count={1} />);
    expect(getByLabelText('Ouvrir les filtres, 1 filtre actif')).toBeTruthy();

    rerender(<FiltersButton onPress={jest.fn()} count={4} />);
    expect(getByLabelText('Ouvrir les filtres, 4 filtres actifs')).toBeTruthy();
  });
});
