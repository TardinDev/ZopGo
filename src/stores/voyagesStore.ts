import { create } from 'zustand';

type VoyageTab = 'transport' | 'hebergement';

interface VoyagesState {
    // État
    selectedTab: VoyageTab;
    selectedType: string;
    fromCity: string;
    toCity: string;
    searchLocation: string;

    // Actions
    setSelectedTab: (tab: VoyageTab) => void;
    setSelectedType: (type: string) => void;
    setFromCity: (city: string) => void;
    setToCity: (city: string) => void;
    setSearchLocation: (location: string) => void;
    swapCities: () => void;
    resetFilters: () => void;
}

export const useVoyagesStore = create<VoyagesState>((set, get) => ({
    // État initial
    selectedTab: 'transport',
    selectedType: 'All',
    fromCity: '',
    toCity: '',
    searchLocation: '',

    // Actions
    setSelectedTab: (tab) => set({ selectedTab: tab, selectedType: 'All' }),
    setSelectedType: (type) => set({ selectedType: type }),
    setFromCity: (city) => set({ fromCity: city }),
    setToCity: (city) => set({ toCity: city }),
    setSearchLocation: (location) => set({ searchLocation: location }),
    swapCities: () => {
        const { fromCity, toCity } = get();
        set({ fromCity: toCity, toCity: fromCity });
    },
    resetFilters: () => set({
        selectedType: 'All',
        fromCity: '',
        toCity: '',
        searchLocation: '',
    }),
}));
