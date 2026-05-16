import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { RatingModal } from '../RatingModal';

describe('RatingModal', () => {
  it('does not render content when visible=false', () => {
    const { queryByText } = render(
      <RatingModal visible={false} onClose={jest.fn()} onSubmit={jest.fn()} />
    );
    expect(queryByText('Évaluez votre expérience')).toBeNull();
  });

  it('renders the title + custom userName in the subtitle', () => {
    const { getByText } = render(
      <RatingModal
        visible
        onClose={jest.fn()}
        onSubmit={jest.fn()}
        userName="Pierre"
      />
    );
    expect(getByText('Évaluez votre expérience')).toBeTruthy();
    expect(getByText(/Pierre/)).toBeTruthy();
  });

  it('passes the tripType through to the subtitle copy', () => {
    const { getByText } = render(
      <RatingModal
        visible
        onClose={jest.fn()}
        onSubmit={jest.fn()}
        tripType="livraison"
        userName="Marc"
      />
    );
    expect(getByText(/livraison/)).toBeTruthy();
  });

  it('shows "Touchez pour noter" before any star is selected', () => {
    const { getByText } = render(
      <RatingModal visible onClose={jest.fn()} onSubmit={jest.fn()} />
    );
    expect(getByText('Touchez pour noter')).toBeTruthy();
  });

  it('submit button is disabled when rating=0', () => {
    const submit = jest.fn();
    const { getByLabelText } = render(
      <RatingModal visible onClose={jest.fn()} onSubmit={submit} />
    );
    const submitBtn = getByLabelText("Envoyer l'évaluation");
    expect(submitBtn.props.accessibilityState).toMatchObject({ disabled: true });
    fireEvent.press(submitBtn);
    expect(submit).not.toHaveBeenCalled();
  });

  it('calls onClose when Annuler is pressed', () => {
    const close = jest.fn();
    const { getByLabelText } = render(
      <RatingModal visible onClose={close} onSubmit={jest.fn()} />
    );
    fireEvent.press(getByLabelText("Annuler l'évaluation"));
    expect(close).toHaveBeenCalledTimes(1);
  });
});
