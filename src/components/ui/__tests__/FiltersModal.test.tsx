import React from 'react';
import { Text } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import { FiltersModal, FilterSection, FilterChip } from '../FiltersModal';

describe('FilterChip', () => {
  it('calls onPress when tapped', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <FilterChip label="Matin" active={false} onPress={onPress} />
    );
    fireEvent.press(getByText('Matin'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('reflects active state via colored text', () => {
    const { getByText, rerender } = render(
      <FilterChip label="Tri" active={false} onPress={jest.fn()} />
    );
    const inactiveText = getByText('Tri');
    const inactiveStyle = Array.isArray(inactiveText.props.style)
      ? Object.assign({}, ...inactiveText.props.style)
      : inactiveText.props.style;

    rerender(<FilterChip label="Tri" active onPress={jest.fn()} />);
    const activeText = getByText('Tri');
    const activeStyle = Array.isArray(activeText.props.style)
      ? Object.assign({}, ...activeText.props.style)
      : activeText.props.style;

    // Active variant overrides the colour
    expect(activeStyle.color).not.toBe(inactiveStyle.color);
  });
});

describe('FilterSection', () => {
  it('renders the label + children', () => {
    const { getByText } = render(
      <FilterSection label="Prix">
        <Text>Child A</Text>
        <Text>Child B</Text>
      </FilterSection>
    );
    expect(getByText('Prix')).toBeTruthy();
    expect(getByText('Child A')).toBeTruthy();
    expect(getByText('Child B')).toBeTruthy();
  });
});

describe('FiltersModal', () => {
  it('does not render content when visible=false', () => {
    const { queryByText } = render(
      <FiltersModal
        visible={false}
        onClose={jest.fn()}
        onReset={jest.fn()}
        onApply={jest.fn()}
        resultsCount={5}
      >
        <Text>section</Text>
      </FiltersModal>
    );
    expect(queryByText('Filtres')).toBeNull();
  });

  it('renders default "Filtres" title', () => {
    const { getByText } = render(
      <FiltersModal
        visible
        onClose={jest.fn()}
        onReset={jest.fn()}
        onApply={jest.fn()}
        resultsCount={5}
      >
        <Text>section</Text>
      </FiltersModal>
    );
    expect(getByText('Filtres')).toBeTruthy();
  });

  it('honours a custom title', () => {
    const { getByText } = render(
      <FiltersModal
        visible
        onClose={jest.fn()}
        onReset={jest.fn()}
        onApply={jest.fn()}
        resultsCount={5}
        title="Tri & Filtres"
      >
        <Text>section</Text>
      </FiltersModal>
    );
    expect(getByText('Tri & Filtres')).toBeTruthy();
  });

  it('shows "Voir N résultats" when count > 0', () => {
    const { getByText } = render(
      <FiltersModal visible onClose={jest.fn()} onReset={jest.fn()} onApply={jest.fn()} resultsCount={1}>
        <Text>x</Text>
      </FiltersModal>
    );
    expect(getByText('Voir 1 résultat')).toBeTruthy();
  });

  it('pluralises "résultats" past 1', () => {
    const { getByText } = render(
      <FiltersModal visible onClose={jest.fn()} onReset={jest.fn()} onApply={jest.fn()} resultsCount={7}>
        <Text>x</Text>
      </FiltersModal>
    );
    expect(getByText('Voir 7 résultats')).toBeTruthy();
  });

  it('shows "Aucun résultat" when count=0 (CTA still tappable)', () => {
    const { getByText } = render(
      <FiltersModal visible onClose={jest.fn()} onReset={jest.fn()} onApply={jest.fn()} resultsCount={0}>
        <Text>x</Text>
      </FiltersModal>
    );
    expect(getByText('Aucun résultat')).toBeTruthy();
  });

  it('apply / reset wire to the respective callbacks', () => {
    const onApply = jest.fn();
    const onReset = jest.fn();
    const { getByText } = render(
      <FiltersModal visible onClose={jest.fn()} onReset={onReset} onApply={onApply} resultsCount={3}>
        <Text>x</Text>
      </FiltersModal>
    );

    fireEvent.press(getByText('Réinitialiser'));
    expect(onReset).toHaveBeenCalledTimes(1);

    fireEvent.press(getByText('Voir 3 résultats'));
    expect(onApply).toHaveBeenCalledTimes(1);
  });
});
