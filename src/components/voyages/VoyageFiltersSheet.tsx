import React, { useState, useEffect } from 'react';
import { FiltersModal, FilterSection, FilterChip } from '../ui/FiltersModal';
import type { DepartureWindow, VoyageSort } from '../../lib/voyagesFilters';

interface VoyageFiltersSheetProps {
  visible: boolean;
  onClose: () => void;
  priceMax: number | null;
  departureWindow: DepartureWindow | null;
  sortBy: VoyageSort;
  // Pure function: returns how many results would show with these drafts.
  // Wired by the screen so this component stays oblivious to data fetching.
  computeCount: (drafts: {
    priceMax: number | null;
    departureWindow: DepartureWindow | null;
    sortBy: VoyageSort;
  }) => number;
  onApply: (next: {
    priceMax: number | null;
    departureWindow: DepartureWindow | null;
    sortBy: VoyageSort;
  }) => void;
  onReset: () => void;
}

const PRICE_PRESETS: { label: string; value: number | null }[] = [
  { label: 'Peu importe', value: null },
  { label: '< 3 000 FCFA', value: 3000 },
  { label: '< 7 000 FCFA', value: 7000 },
  { label: '< 15 000 FCFA', value: 15000 },
  { label: '< 30 000 FCFA', value: 30000 },
];

const WINDOW_PRESETS: { label: string; value: DepartureWindow | null }[] = [
  { label: 'Peu importe', value: null },
  { label: 'Matin 6h–12h', value: 'morning' },
  { label: 'Après-midi 12h–18h', value: 'afternoon' },
  { label: 'Soir 18h–24h', value: 'evening' },
  { label: 'Nuit 0h–6h', value: 'night' },
];

const SORT_PRESETS: { label: string; value: VoyageSort }[] = [
  { label: 'Par défaut', value: 'default' },
  { label: 'Prix ↑', value: 'price_asc' },
  { label: 'Prix ↓', value: 'price_desc' },
  { label: 'Mieux notés', value: 'rating_desc' },
  { label: 'Départ le plus tôt', value: 'date_asc' },
];

export function VoyageFiltersSheet({
  visible,
  onClose,
  priceMax,
  departureWindow,
  sortBy,
  computeCount,
  onApply,
  onReset,
}: VoyageFiltersSheetProps) {
  // Drafts so toggling chips inside the modal doesn't mutate the store until
  // the user taps "Voir N résultats". Resync drafts every time the modal is
  // re-opened so a cancelled session doesn't leak stale state.
  const [draftPrice, setDraftPrice] = useState<number | null>(priceMax);
  const [draftWindow, setDraftWindow] = useState<DepartureWindow | null>(departureWindow);
  const [draftSort, setDraftSort] = useState<VoyageSort>(sortBy);

  useEffect(() => {
    if (visible) {
      setDraftPrice(priceMax);
      setDraftWindow(departureWindow);
      setDraftSort(sortBy);
    }
  }, [visible, priceMax, departureWindow, sortBy]);

  const handleApply = () => {
    onApply({ priceMax: draftPrice, departureWindow: draftWindow, sortBy: draftSort });
    onClose();
  };

  const handleReset = () => {
    setDraftPrice(null);
    setDraftWindow(null);
    setDraftSort('default');
    onReset();
  };

  const liveCount = computeCount({
    priceMax: draftPrice,
    departureWindow: draftWindow,
    sortBy: draftSort,
  });

  return (
    <FiltersModal
      visible={visible}
      onClose={onClose}
      onReset={handleReset}
      onApply={handleApply}
      resultsCount={liveCount}
    >
      <FilterSection label="Prix maximum">
        {PRICE_PRESETS.map((p) => (
          <FilterChip
            key={String(p.value)}
            label={p.label}
            active={draftPrice === p.value}
            onPress={() => setDraftPrice(p.value)}
          />
        ))}
      </FilterSection>

      <FilterSection label="Horaire de départ">
        {WINDOW_PRESETS.map((w) => (
          <FilterChip
            key={String(w.value)}
            label={w.label}
            active={draftWindow === w.value}
            onPress={() => setDraftWindow(w.value)}
          />
        ))}
      </FilterSection>

      <FilterSection label="Trier par">
        {SORT_PRESETS.map((s) => (
          <FilterChip
            key={s.value}
            label={s.label}
            active={draftSort === s.value}
            onPress={() => setDraftSort(s.value)}
          />
        ))}
      </FilterSection>
    </FiltersModal>
  );
}
