import React from 'react';
import { render } from '@testing-library/react-native';
import { ChauffeurDashboard } from '../ChauffeurDashboard';
import type { ChauffeurStats } from '../../../lib/chauffeurStats';

function stats(overrides: Partial<ChauffeurStats> = {}): ChauffeurStats {
  return {
    totalCourses: 0,
    coursesAcceptees: 0,
    coursesTerminees: 0,
    revenus: 0,
    tauxAcceptationPct: 0,
    noteMoyenne: 0,
    ...overrides,
  };
}

describe('ChauffeurDashboard', () => {
  it('renders all 4 KPI labels', () => {
    const { getByText } = render(<ChauffeurDashboard stats={stats()} />);
    expect(getByText('Courses livrées')).toBeTruthy();
    expect(getByText('Revenus')).toBeTruthy();
    expect(getByText('Note moyenne')).toBeTruthy();
    expect(getByText('Acceptation')).toBeTruthy();
  });

  it('shows the courses-terminée count', () => {
    const { getByText } = render(<ChauffeurDashboard stats={stats({ coursesTerminees: 12 })} />);
    expect(getByText('12')).toBeTruthy();
  });

  it('formats revenus as FCFA with thousands separator', () => {
    const { getByText } = render(<ChauffeurDashboard stats={stats({ revenus: 1234567 })} />);
    // The thousands separator is NBSP ( ) on Node ICU — strip whitespace
    // to make the assertion locale-independent.
    const text = getByText(/FCFA$/).props.children as string;
    expect(text.replace(/\s/g, '')).toBe('1234567FCFA');
  });

  it('shows "—" instead of 0.0 when noteMoyenne is 0 (no ratings yet)', () => {
    const { getByText } = render(<ChauffeurDashboard stats={stats({ noteMoyenne: 0 })} />);
    expect(getByText('—')).toBeTruthy();
  });

  it('shows the noteMoyenne with one decimal when > 0', () => {
    // Use 4.7 (representable exactly enough for toFixed(1)='4.7') to avoid
    // the 4.85 → "4.8" IEEE-754 surprise.
    const { getByText } = render(<ChauffeurDashboard stats={stats({ noteMoyenne: 4.7 })} />);
    expect(getByText('4.7')).toBeTruthy();
  });

  it('shows the acceptation rate as percent', () => {
    const { getByText } = render(<ChauffeurDashboard stats={stats({ tauxAcceptationPct: 87 })} />);
    expect(getByText('87%')).toBeTruthy();
  });
});
