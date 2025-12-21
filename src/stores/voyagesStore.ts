import { create } from 'zustand';

interface VoyagesState {
    // État
    selectedType: string;
    fromCity: string;
    toCity: string;

    // Actions
    setSelectedType: (type: string) => void;
    setFromCity: (city: string) => void;
    setToCity: (city: string) => void;
    swapCities: () => void;
    resetFilters: () => void;
}

export const useVoyagesStore = create<VoyagesState>((set, get) => ({
    // État initial
    selectedType: 'All',
    fromCity: '',
    toCity: '',

    // Actions
    setSelectedType: (type) => set({ selectedType: type }),
    setFromCity: (city) => set({ fromCity: city }),
    setToCity: (city) => set({ toCity: city }),
    swapCities: () => {
        const { fromCity, toCity } = get();
        set({ fromCity: toCity, toCity: fromCity });
    },
    resetFilters: () => set({
        selectedType: 'All',
        fromCity: '',
        toCity: '',
    }),
}));
