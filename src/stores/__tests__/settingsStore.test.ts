import { useSettingsStore } from '../settingsStore';

beforeEach(() => {
  useSettingsStore.setState({
    vehicles: [],
    paymentMethods: [],
    favoriteAddresses: [],
    generalSettings: {
      language: 'fr',
      darkMode: false,
      notificationSound: true,
      shareLocation: true,
    },
  });
});

describe('vehicles', () => {
  it('addVehicle inserts with a generated id', () => {
    useSettingsStore.getState().addVehicle({
      label: 'Toyota',
      type: 'voiture',
      plaque: 'AB-123-CD',
      isDefault: false,
    });
    const v = useSettingsStore.getState().vehicles;
    expect(v).toHaveLength(1);
    expect(v[0].id).toBeTruthy();
    expect(v[0].label).toBe('Toyota');
  });

  it('addVehicle with isDefault=true demotes any previous default', () => {
    const { addVehicle } = useSettingsStore.getState();
    addVehicle({ label: 'A', type: 'moto', plaque: '1', isDefault: true });
    addVehicle({ label: 'B', type: 'voiture', plaque: '2', isDefault: true });
    const v = useSettingsStore.getState().vehicles;
    expect(v.filter((x) => x.isDefault)).toHaveLength(1);
    expect(v.find((x) => x.label === 'B')?.isDefault).toBe(true);
  });

  it('removeVehicle drops only the matching id', () => {
    useSettingsStore.getState().addVehicle({ label: 'A', type: 'moto', plaque: '1', isDefault: false });
    useSettingsStore.getState().addVehicle({ label: 'B', type: 'voiture', plaque: '2', isDefault: false });
    const targetId = useSettingsStore.getState().vehicles[0].id;
    useSettingsStore.getState().removeVehicle(targetId);
    const v = useSettingsStore.getState().vehicles;
    expect(v).toHaveLength(1);
    expect(v[0].label).toBe('B');
  });

  it('setDefaultVehicle flips exactly one to default', () => {
    const s = useSettingsStore.getState();
    s.addVehicle({ label: 'A', type: 'moto', plaque: '1', isDefault: true });
    s.addVehicle({ label: 'B', type: 'voiture', plaque: '2', isDefault: false });
    const bId = useSettingsStore.getState().vehicles.find((v) => v.label === 'B')!.id;
    useSettingsStore.getState().setDefaultVehicle(bId);
    const v = useSettingsStore.getState().vehicles;
    expect(v.find((x) => x.label === 'A')?.isDefault).toBe(false);
    expect(v.find((x) => x.label === 'B')?.isDefault).toBe(true);
  });

  it('updateVehicle merges partial updates', () => {
    useSettingsStore.getState().addVehicle({ label: 'A', type: 'moto', plaque: 'OLD', isDefault: false });
    const id = useSettingsStore.getState().vehicles[0].id;
    useSettingsStore.getState().updateVehicle(id, { plaque: 'NEW' });
    expect(useSettingsStore.getState().vehicles[0].plaque).toBe('NEW');
  });
});

describe('paymentMethods — mirrors vehicles semantics', () => {
  it('only one default at a time when adding with isDefault=true', () => {
    const s = useSettingsStore.getState();
    s.addPaymentMethod({ type: 'card', label: 'Visa', lastDigits: '1234', provider: 'visa', isDefault: true });
    s.addPaymentMethod({ type: 'mobile_money', label: 'Airtel', lastDigits: '7890', provider: 'airtel_money', isDefault: true });
    const m = useSettingsStore.getState().paymentMethods;
    expect(m.filter((x) => x.isDefault)).toHaveLength(1);
  });

  it('setDefaultPaymentMethod swaps defaults atomically', () => {
    const s = useSettingsStore.getState();
    s.addPaymentMethod({ type: 'card', label: 'Visa', lastDigits: '1', provider: 'visa', isDefault: true });
    s.addPaymentMethod({ type: 'card', label: 'MC', lastDigits: '2', provider: 'mastercard', isDefault: false });
    const mcId = useSettingsStore.getState().paymentMethods.find((m) => m.label === 'MC')!.id;
    useSettingsStore.getState().setDefaultPaymentMethod(mcId);
    expect(useSettingsStore.getState().paymentMethods.find((m) => m.label === 'Visa')?.isDefault).toBe(false);
    expect(useSettingsStore.getState().paymentMethods.find((m) => m.label === 'MC')?.isDefault).toBe(true);
  });
});

describe('favoriteAddresses', () => {
  it('add + update + remove flow', () => {
    const s = useSettingsStore.getState();
    s.addFavoriteAddress({ label: 'Maison', address: '1 rue X', icon: 'home' });
    s.addFavoriteAddress({ label: 'Bureau', address: '2 av Y', icon: 'briefcase' });
    const homeId = useSettingsStore.getState().favoriteAddresses[0].id;
    useSettingsStore.getState().updateFavoriteAddress(homeId, { address: '1 rue Z' });
    expect(useSettingsStore.getState().favoriteAddresses[0].address).toBe('1 rue Z');
    useSettingsStore.getState().removeFavoriteAddress(homeId);
    expect(useSettingsStore.getState().favoriteAddresses).toHaveLength(1);
    expect(useSettingsStore.getState().favoriteAddresses[0].label).toBe('Bureau');
  });
});

describe('generalSettings', () => {
  it('updateGeneralSettings merges (doesn\'t overwrite)', () => {
    useSettingsStore.getState().updateGeneralSettings({ darkMode: true });
    const s = useSettingsStore.getState().generalSettings;
    expect(s.darkMode).toBe(true);
    expect(s.language).toBe('fr'); // unchanged
    expect(s.notificationSound).toBe(true); // unchanged
  });
});
