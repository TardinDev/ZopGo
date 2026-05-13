import React, { useState, useEffect } from 'react';
import { FiltersModal, FilterSection, FilterChip } from '../ui/FiltersModal';
import type { HebergementSort } from '../../lib/hebergementsFilters';

interface HebergementFiltersSheetProps {
  visible: boolean;
  onClose: () => void;
  priceMax: number | null;
  minCapacity: number | null;
  sortBy: HebergementSort;
  computeCount: (drafts: {
    priceMax: number | null;
    minCapacity: number | null;
    sortBy: HebergementSort;
  }) => number;
  onApply: (next: {
    priceMax: number | null;
    minCapacity: number | null;
    sortBy: HebergementSort;
  }) => void;
  onReset: () => void;
}

const PRICE_PRESETS: { label: string; value: number | null }[] = [
  { label: 'Peu importe', value: null },
  { label: '< 15 000 FCFA/nuit', value: 15000 },
  { label: '< 30 000 FCFA/nuit', value: 30000 },
  { label: '< 50 000 FCFA/nuit', value: 50000 },
  { label: '< 100 000 FCFA/nuit', value: 100000 },
];

const CAPACITY_PRESETS: { label: string; value: number | null }[] = [
  { label: 'Peu importe', value: null },
  { label: '1+ pers.', value: 1 },
  { label: '2+ pers.', value: 2 },
  { label: '4+ pers.', value: 4 },
  { label: '6+ pers.', value: 6 },
];

const SORT_PRESETS: { label: string; value: HebergementSort }[] = [
  { label: 'Par défaut', value: 'default' },
  { label: 'Prix ↑', value: 'price_asc' },
  { label: 'Prix ↓', value: 'price_desc' },
  { label: 'Mieux notés', value: 'rating_desc' },
];

export function HebergementFiltersSheet({
  visible,
  onClose,
  priceMax,
  minCapacity,
  sortBy,
  computeCount,
  onApply,
  onReset,
}: HebergementFiltersSheetProps) {
  const [draftPrice, setDraftPrice] = useState<number | null>(priceMax);
  const [draftCapacity, setDraftCapacity] = useState<number | null>(minCapacity);
  const [draftSort, setDraftSort] = useState<HebergementSort>(sortBy);

  useEffect(() => {
    if (visible) {
      setDraftPrice(priceMax);
      setDraftCapacity(minCapacity);
      setDraftSort(sortBy);
    }
  }, [visible, priceMax, minCapacity, sortBy]);

  const handleApply = () => {
    onApply({ priceMax: draftPrice, minCapacity: draftCapacity, sortBy: draftSort });
    onClose();
  };

  const handleReset = () => {
    setDraftPrice(null);
    setDraftCapacity(null);
    setDraftSort('default');
    onReset();
  };

  const liveCount = computeCount({
    priceMax: draftPrice,
    minCapacity: draftCapacity,
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

      <FilterSection label="Capacité minimum">
        {CAPACITY_PRESETS.map((c) => (
          <FilterChip
            key={String(c.value)}
            label={c.label}
            active={draftCapacity === c.value}
            onPress={() => setDraftCapacity(c.value)}
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
