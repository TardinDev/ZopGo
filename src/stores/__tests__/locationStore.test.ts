import { useLocationStore } from '../locationStore';
import { vehicles } from '../../data';

beforeEach(() => {
  useLocationStore.setState({
    searchQuery: '',
    selectedType: 'tous',
    filteredVehicles: vehicles,
    favorites: [],
  });
});

describe('locationStore', () => {
  describe('initial state', () => {
    it('starts with all vehicles', () => {
      expect(useLocationStore.getState().filteredVehicles).toEqual(vehicles);
    });

    it('starts with empty search query', () => {
      expect(useLocationStore.getState().searchQuery).toBe('');
    });

    it('starts with type tous', () => {
      expect(useLocationStore.getState().selectedType).toBe('tous');
    });

    it('starts with no favorites', () => {
      expect(useLocationStore.getState().favorites).toEqual([]);
    });
  });

  describe('setSearchQuery', () => {
    it('filters vehicles by name', () => {
      useLocationStore.getState().setSearchQuery('Toyota');
      const filtered = useLocationStore.getState().filteredVehicles;
      expect(filtered.length).toBeGreaterThan(0);
      expect(filtered.every((v) => v.name.toLowerCase().includes('toyota'))).toBe(true);
    });

    it('filters vehicles by location', () => {
      useLocationStore.getState().setSearchQuery('Owendo');
      const filtered = useLocationStore.getState().filteredVehicles;
      expect(filtered.length).toBeGreaterThan(0);
      expect(filtered.every((v) => v.location.toLowerCase().includes('owendo'))).toBe(true);
    });

    it('is case insensitive', () => {
      useLocationStore.getState().setSearchQuery('toyota');
      const filtered1 = useLocationStore.getState().filteredVehicles;
      useLocationStore.getState().setSearchQuery('TOYOTA');
      const filtered2 = useLocationStore.getState().filteredVehicles;
      expect(filtered1.length).toBe(filtered2.length);
    });

    it('returns empty for no match', () => {
      useLocationStore.getState().setSearchQuery('xyznonexistent');
      expect(useLocationStore.getState().filteredVehicles).toHaveLength(0);
    });

    it('returns all when query is empty', () => {
      useLocationStore.getState().setSearchQuery('Toyota');
      useLocationStore.getState().setSearchQuery('');
      expect(useLocationStore.getState().filteredVehicles).toEqual(vehicles);
    });

    it('updates searchQuery state', () => {
      useLocationStore.getState().setSearchQuery('test');
      expect(useLocationStore.getState().searchQuery).toBe('test');
    });
  });

  describe('setSelectedType', () => {
    it('filters by voiture type', () => {
      useLocationStore.getState().setSelectedType('voiture');
      const filtered = useLocationStore.getState().filteredVehicles;
      expect(filtered.every((v) => v.type === 'voiture')).toBe(true);
    });

    it('filters by moto type', () => {
      useLocationStore.getState().setSelectedType('moto');
      const filtered = useLocationStore.getState().filteredVehicles;
      expect(filtered.every((v) => v.type === 'moto')).toBe(true);
    });

    it('shows all with type tous', () => {
      useLocationStore.getState().setSelectedType('moto');
      useLocationStore.getState().setSelectedType('tous');
      expect(useLocationStore.getState().filteredVehicles).toEqual(vehicles);
    });

    it('combines with search query', () => {
      useLocationStore.getState().setSearchQuery('Libreville');
      useLocationStore.getState().setSelectedType('voiture');
      const filtered = useLocationStore.getState().filteredVehicles;
      expect(filtered.every((v) => v.type === 'voiture')).toBe(true);
      expect(
        filtered.every(
          (v) =>
            v.name.toLowerCase().includes('libreville') ||
            v.location.toLowerCase().includes('libreville')
        )
      ).toBe(true);
    });
  });

  describe('toggleFavorite', () => {
    it('adds to favorites', () => {
      useLocationStore.getState().toggleFavorite('1');
      expect(useLocationStore.getState().favorites).toContain('1');
    });

    it('removes from favorites on second toggle', () => {
      useLocationStore.getState().toggleFavorite('1');
      useLocationStore.getState().toggleFavorite('1');
      expect(useLocationStore.getState().favorites).not.toContain('1');
    });

    it('handles multiple favorites', () => {
      useLocationStore.getState().toggleFavorite('1');
      useLocationStore.getState().toggleFavorite('2');
      useLocationStore.getState().toggleFavorite('3');
      expect(useLocationStore.getState().favorites).toEqual(['1', '2', '3']);
    });

    it('removes only the toggled favorite', () => {
      useLocationStore.getState().toggleFavorite('1');
      useLocationStore.getState().toggleFavorite('2');
      useLocationStore.getState().toggleFavorite('1');
      expect(useLocationStore.getState().favorites).toEqual(['2']);
    });
  });
});
