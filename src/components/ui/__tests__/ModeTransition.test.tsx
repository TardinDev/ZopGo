import React from 'react';
import { act, render } from '@testing-library/react-native';
import { ModeTransition } from '../ModeTransition';

describe('ModeTransition', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders nothing when visible is false', () => {
    const { queryByText } = render(
      <ModeTransition visible={false} role="client" onComplete={jest.fn()} />
    );
    expect(queryByText('Mode Client')).toBeNull();
    expect(queryByText('Mode Transporteur')).toBeNull();
    expect(queryByText('Mode Hébergeur')).toBeNull();
  });

  it('shows the Mode Client title and subtitle for the client role', () => {
    const { getByText } = render(
      <ModeTransition visible role="client" onComplete={jest.fn()} />
    );
    expect(getByText('Mode Client')).toBeTruthy();
    expect(getByText(/Commandez vos trajets et livraisons/)).toBeTruthy();
  });

  it('shows the Mode Transporteur title for the chauffeur role', () => {
    const { getByText } = render(
      <ModeTransition visible role="chauffeur" onComplete={jest.fn()} />
    );
    expect(getByText('Mode Transporteur')).toBeTruthy();
  });

  it('shows the Mode Hébergeur title for the hebergeur role', () => {
    const { getByText } = render(
      <ModeTransition visible role="hebergeur" onComplete={jest.fn()} />
    );
    expect(getByText('Mode Hébergeur')).toBeTruthy();
  });

  it('calls onComplete after the quick dismiss delay (~1.2s + fade)', () => {
    const onComplete = jest.fn();
    render(
      <ModeTransition visible role="chauffeur" onComplete={onComplete} quick />
    );
    expect(onComplete).not.toHaveBeenCalled();

    // Quick mode: dismissDelay = 1200ms, fade out = 300ms.
    // Reanimated fakes the withTiming callback through requestAnimationFrame
    // and microtasks; flush both timers + pending promises a couple of times
    // to be safe.
    act(() => {
      jest.advanceTimersByTime(1200);
    });
    act(() => {
      jest.advanceTimersByTime(400);
    });

    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('calls onComplete after the standard dismiss delay (~2.8s + fade)', () => {
    const onComplete = jest.fn();
    render(
      <ModeTransition visible role="client" onComplete={onComplete} />
    );

    // Standard mode: dismissDelay = 2800ms.
    act(() => {
      jest.advanceTimersByTime(2800);
    });
    act(() => {
      jest.advanceTimersByTime(400);
    });

    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});
