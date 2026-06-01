import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { TypeFilter } from '../TypeFilter';

// Regression guard: TypeFilter is shared between Voyages (transport) and
// Hébergements (accommodation). Accommodation types must resolve to their
// own emoji + label, NOT the fallback ('—') that shipped before.
const HEBERGEMENT_TYPES = ['All', 'Hôtel', 'Auberge', 'Appart.', 'Maison', 'Chambre'];

describe('TypeFilter', () => {
  it('renders accommodation type labels (not the "—" fallback)', () => {
    const { getByText, queryAllByText } = render(
      <TypeFilter types={HEBERGEMENT_TYPES} selectedType="All" onTypeChange={jest.fn()} />
    );
    expect(getByText('Hôtel')).toBeTruthy();
    expect(getByText('Auberge')).toBeTruthy();
    expect(getByText('Maison')).toBeTruthy();
    expect(getByText('Chambre')).toBeTruthy();
    // The old bug rendered every accommodation chip as the '—' fallback.
    expect(queryAllByText('—')).toHaveLength(0);
  });

  it('renders accommodation emojis (icons present)', () => {
    const { getByText } = render(
      <TypeFilter types={HEBERGEMENT_TYPES} selectedType="All" onTypeChange={jest.fn()} />
    );
    expect(getByText('🏨')).toBeTruthy(); // Hôtel
    expect(getByText('🏡')).toBeTruthy(); // Maison
  });

  it('still renders transport categories (shared component)', () => {
    const { getByText } = render(
      <TypeFilter types={['All', 'Bus', 'Avion']} selectedType="All" onTypeChange={jest.fn()} />
    );
    expect(getByText('Bus')).toBeTruthy();
    expect(getByText('Avion')).toBeTruthy();
  });

  it('falls back to the raw type name (never blank) for an unknown type', () => {
    const { getByText } = render(
      <TypeFilter types={['Zeppelin']} selectedType="All" onTypeChange={jest.fn()} />
    );
    expect(getByText('Zeppelin')).toBeTruthy();
  });

  it('fires onTypeChange when a chip is pressed', () => {
    const onTypeChange = jest.fn();
    const { getByText } = render(
      <TypeFilter types={HEBERGEMENT_TYPES} selectedType="All" onTypeChange={onTypeChange} />
    );
    fireEvent.press(getByText('Maison'));
    expect(onTypeChange).toHaveBeenCalledWith('Maison');
  });
});
