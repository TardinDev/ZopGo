jest.mock('../../lib/supabaseHebergementFavorites');

import { useFavoritesStore } from '../favoritesStore';
import {
  fetchFavoriteIds,
  addFavorite,
  removeFavorite,
} from '../../lib/supabaseHebergementFavorites';

beforeEach(() => {
  jest.clearAllMocks();
  useFavoritesStore.setState({
    clientId: null,
    favoriteIds: [],
    favorites: [],
    isLoading: false,
  });
});

describe('favoritesStore', () => {
  it('loadFavoriteIds stores the clientId and the ids', async () => {
    (fetchFavoriteIds as jest.Mock).mockResolvedValue(['h1', 'h2']);
    await useFavoritesStore.getState().loadFavoriteIds('c1');
    expect(useFavoritesStore.getState().clientId).toBe('c1');
    expect(useFavoritesStore.getState().favoriteIds).toEqual(['h1', 'h2']);
  });

  it('toggleFavorite optimistically adds then persists', async () => {
    (addFavorite as jest.Mock).mockResolvedValue(true);
    useFavoritesStore.setState({ clientId: 'c1', favoriteIds: [] });
    await useFavoritesStore.getState().toggleFavorite('h1');
    expect(addFavorite).toHaveBeenCalledWith('c1', 'h1');
    expect(useFavoritesStore.getState().favoriteIds).toEqual(['h1']);
  });

  it('toggleFavorite removes an existing favourite', async () => {
    (removeFavorite as jest.Mock).mockResolvedValue(true);
    useFavoritesStore.setState({ clientId: 'c1', favoriteIds: ['h1', 'h2'] });
    await useFavoritesStore.getState().toggleFavorite('h1');
    expect(removeFavorite).toHaveBeenCalledWith('c1', 'h1');
    expect(useFavoritesStore.getState().favoriteIds).toEqual(['h2']);
  });

  it('rolls back to the original list when persistence fails', async () => {
    (addFavorite as jest.Mock).mockResolvedValue(false);
    useFavoritesStore.setState({ clientId: 'c1', favoriteIds: [] });
    await useFavoritesStore.getState().toggleFavorite('h1');
    expect(useFavoritesStore.getState().favoriteIds).toEqual([]);
  });

  it('is a no-op without a clientId (favourites not loaded yet)', async () => {
    useFavoritesStore.setState({ clientId: null, favoriteIds: [] });
    await useFavoritesStore.getState().toggleFavorite('h1');
    expect(addFavorite).not.toHaveBeenCalled();
    expect(useFavoritesStore.getState().favoriteIds).toEqual([]);
  });
});
