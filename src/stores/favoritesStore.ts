import { create } from 'zustand';
import { Hebergement } from '../types';
import {
  fetchFavoriteIds,
  fetchFavoriteHebergements,
  addFavorite,
  removeFavorite,
} from '../lib/supabaseHebergementFavorites';

interface FavoritesState {
  clientId: string | null;
  favoriteIds: string[];
  favorites: Hebergement[];
  isLoading: boolean;

  /** Lightweight: just the favourited ids (to light up hearts on cards). */
  loadFavoriteIds: (clientId: string) => Promise<void>;
  /** Full listings for the "Mes favoris" screen. */
  loadFavorites: (clientId: string) => Promise<void>;
  toggleFavorite: (hebergementId: string) => Promise<void>;
}

export const useFavoritesStore = create<FavoritesState>((set, get) => ({
  clientId: null,
  favoriteIds: [],
  favorites: [],
  isLoading: false,

  loadFavoriteIds: async (clientId) => {
    set({ clientId });
    set({ favoriteIds: await fetchFavoriteIds(clientId) });
  },

  loadFavorites: async (clientId) => {
    set({ clientId, isLoading: true });
    try {
      const list = await fetchFavoriteHebergements(clientId);
      set({ favorites: list, favoriteIds: list.map((h) => h.supabaseId) });
    } finally {
      set({ isLoading: false });
    }
  },

  toggleFavorite: async (hebergementId) => {
    const { clientId, favoriteIds } = get();
    if (!clientId) return;
    const isFav = favoriteIds.includes(hebergementId);
    // Optimistic update — restore the captured list on failure.
    set({
      favoriteIds: isFav
        ? favoriteIds.filter((id) => id !== hebergementId)
        : [...favoriteIds, hebergementId],
      // Drop it from the loaded favourites list immediately when un-faving.
      favorites: isFav
        ? get().favorites.filter((h) => h.supabaseId !== hebergementId)
        : get().favorites,
    });
    const ok = isFav
      ? await removeFavorite(clientId, hebergementId)
      : await addFavorite(clientId, hebergementId);
    if (!ok) {
      set({ favoriteIds });
    }
  },
}));
