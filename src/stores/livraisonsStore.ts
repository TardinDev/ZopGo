import { create } from 'zustand';

interface LivraisonsState {
    // État
    pickupLocation: string;
    dropoffLocation: string;
    showResults: boolean;
    selectedLivreur: number | null;
    waitingForAcceptance: boolean;
    accepted: boolean;
    noResponse: boolean;

    // Actions
    setPickupLocation: (location: string) => void;
    setDropoffLocation: (location: string) => void;
    setShowResults: (show: boolean) => void;
    setSelectedLivreur: (id: number | null) => void;
    setWaitingForAcceptance: (waiting: boolean) => void;
    setAccepted: (accepted: boolean) => void;
    setNoResponse: (noResponse: boolean) => void;
    resetSearch: () => void;
    resetAll: () => void;
}

export const useLivraisonsStore = create<LivraisonsState>((set) => ({
    // État initial
    pickupLocation: '',
    dropoffLocation: '',
    showResults: false,
    selectedLivreur: null,
    waitingForAcceptance: false,
    accepted: false,
    noResponse: false,

    // Actions
    setPickupLocation: (location) => set({ pickupLocation: location }),
    setDropoffLocation: (location) => set({ dropoffLocation: location }),
    setShowResults: (show) => set({ showResults: show }),
    setSelectedLivreur: (id) => set({ selectedLivreur: id }),
    setWaitingForAcceptance: (waiting) => set({ waitingForAcceptance: waiting }),
    setAccepted: (accepted) => set({ accepted }),
    setNoResponse: (noResponse) => set({ noResponse }),

    resetSearch: () => set({
        showResults: false,
        selectedLivreur: null,
        // On garde les localisations pour permettre de relancer une recherche facilement
    }),

    resetAll: () => set({
        pickupLocation: '',
        dropoffLocation: '',
        showResults: false,
        selectedLivreur: null,
        waitingForAcceptance: false,
        accepted: false,
        noResponse: false,
    }),
}));
