/**
 * End-to-end publication flow tests.
 *
 * These tests simulate the full producer → consumer path for both trajets and
 * hebergements by wiring a shared in-memory "fake database" through the
 * already-mocked supabase lib functions. The goal is to catch any mismatch
 * between what a chauffeur/hebergeur writes and what a client reads.
 *
 * Covered flows:
 *   1. Chauffeur publishes a trajet  → appears in client voyages list
 *   2. Hebergeur publishes a hebergement → appears in client discovery list
 *   3. Broadcast push notifications are emitted to clients on trajet publication
 */

import { useTrajetsStore } from '../stores/trajetsStore';
import { useVoyagesStore } from '../stores/voyagesStore';
import { useHebergementsStore } from '../stores/hebergementsStore';
import { useHebergementsDiscoveryStore } from '../stores/hebergementsDiscoveryStore';
import {
  insertTrajet,
  fetchAllAvailableTrajets,
} from '../lib/supabaseTrajets';
import {
  insertHebergement,
  fetchAllAvailableHebergements,
} from '../lib/supabaseHebergements';
import { sendPushBroadcast } from '../lib/pushNotifications';

// -----------------------------------------------------------------------------
// Fake in-memory "database" shared by producer (insert*) and consumer (fetch*)
// -----------------------------------------------------------------------------
interface FakeSupabaseTrajet {
  id: string;
  chauffeur_id: string;
  ville_depart: string;
  ville_arrivee: string;
  prix: number;
  vehicule: string;
  date: string | null;
  places_disponibles: number;
  status: string;
  created_at: string;
  marque: string | null;
  modele: string | null;
  couleur: string | null;
  profiles?: { name: string; avatar: string; rating: number } | null;
}

interface FakeSupabaseHebergement {
  id: string;
  hebergeur_id: string;
  nom: string;
  type: string;
  ville: string;
  adresse: string;
  prix_par_nuit: number;
  capacite: number;
  description: string;
  status: string;
  disponibilite: number;
  images: string[];
  created_at: string;
  profiles?: { name: string; avatar: string; rating: number } | null;
}

const fakeTrajetsDb: FakeSupabaseTrajet[] = [];
const fakeHebergementsDb: FakeSupabaseHebergement[] = [];

let nextId = 1;
const genId = () => `supa-${nextId++}`;

// The chauffeur/hebergeur profile that clients will see on the cards
const FAKE_PROFILE = { name: 'Pierre', avatar: 'pierre.jpg', rating: 4.7 };

beforeEach(() => {
  jest.clearAllMocks();
  fakeTrajetsDb.length = 0;
  fakeHebergementsDb.length = 0;
  nextId = 1;

  // Reset zustand stores
  useTrajetsStore.setState({
    trajets: [],
    formData: {
      villeDepart: '',
      villeArrivee: '',
      prix: '',
      vehicule: 'voiture',
      date: '',
      placesDisponibles: '1',
      marque: '',
      modele: '',
      couleur: '',
    },
    isLoading: false,
  });
  useVoyagesStore.setState({
    trajets: [],
    isLoading: false,
    selectedType: 'All',
    fromCity: '',
    toCity: '',
  });
  useHebergementsStore.setState({
    listings: [],
    formData: {
      nom: '',
      type: 'hotel',
      ville: '',
      adresse: '',
      prixParNuit: '',
      capacite: '1',
      description: '',
      disponible: true,
      disponibilite: '1',
      images: [],
    },
    isLoading: false,
  });
  useHebergementsDiscoveryStore.setState({
    listings: [],
    isLoading: false,
    selectedType: 'All',
    searchLocation: '',
  });

  // -------------------- trajets fake DB wiring --------------------
  (insertTrajet as jest.Mock).mockImplementation(async (payload) => {
    const row: FakeSupabaseTrajet = {
      id: genId(),
      chauffeur_id: payload.chauffeur_id,
      ville_depart: payload.ville_depart,
      ville_arrivee: payload.ville_arrivee,
      prix: payload.prix,
      vehicule: payload.vehicule,
      date: payload.date ?? null,
      places_disponibles: payload.places_disponibles,
      status: 'en_attente', // default from migration 002
      created_at: new Date().toISOString(),
      marque: payload.marque ?? null,
      modele: payload.modele ?? null,
      couleur: payload.couleur ?? null,
      profiles: FAKE_PROFILE,
    };
    fakeTrajetsDb.push(row);
    return row;
  });

  (fetchAllAvailableTrajets as jest.Mock).mockImplementation(async () => {
    // Mirrors the real query: status = 'en_attente' AND places_disponibles > 0
    return fakeTrajetsDb
      .filter((t) => t.status === 'en_attente' && t.places_disponibles > 0)
      .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  });

  // -------------------- hebergements fake DB wiring --------------------
  (insertHebergement as jest.Mock).mockImplementation(async (payload) => {
    const row: FakeSupabaseHebergement = {
      id: genId(),
      hebergeur_id: payload.hebergeur_id,
      nom: payload.nom,
      type: payload.type,
      ville: payload.ville,
      adresse: payload.adresse,
      prix_par_nuit: payload.prix_par_nuit,
      capacite: payload.capacite,
      description: payload.description,
      status: payload.status ?? 'actif',
      disponibilite: payload.disponibilite ?? 1,
      images: payload.images ?? [],
      created_at: new Date().toISOString(),
      profiles: FAKE_PROFILE,
    };
    fakeHebergementsDb.push(row);
    return row;
  });

  (fetchAllAvailableHebergements as jest.Mock).mockImplementation(async () => {
    // Mirrors the real query: status = 'actif' AND disponibilite > 0
    return fakeHebergementsDb
      .filter((h) => h.status === 'actif' && h.disponibilite > 0)
      .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  });
});

// =============================================================================
// Flow 1: Chauffeur publishes a trajet → appears in client voyages list
// =============================================================================
describe('Flow 1 — Chauffeur publishes trajet → Client voyages list', () => {
  async function publishTrajetAsChauffeur(overrides: Partial<{
    villeDepart: string;
    villeArrivee: string;
    prix: string;
    vehicule: 'moto' | 'voiture' | 'camionnette';
    placesDisponibles: string;
    marque: string;
    modele: string;
    couleur: string;
  }> = {}) {
    useTrajetsStore.setState({
      formData: {
        villeDepart: overrides.villeDepart ?? 'Libreville',
        villeArrivee: overrides.villeArrivee ?? 'Franceville',
        prix: overrides.prix ?? '15000',
        vehicule: overrides.vehicule ?? 'voiture',
        date: '2026-06-01T10:00:00.000Z',
        placesDisponibles: overrides.placesDisponibles ?? '4',
        marque: overrides.marque ?? 'Toyota',
        modele: overrides.modele ?? 'Corolla',
        couleur: overrides.couleur ?? 'Blanc',
      },
    });
    await useTrajetsStore
      .getState()
      .addTrajet('chauffeur_clerk_1', 'supa_chauffeur_1');
  }

  it('a published trajet appears in the client voyages list with all mapped fields', async () => {
    // 1. Chauffeur publishes
    await publishTrajetAsChauffeur();

    // 2. Supabase-side: insertTrajet was called with normalized columns
    expect(insertTrajet).toHaveBeenCalledWith(
      expect.objectContaining({
        chauffeur_id: 'supa_chauffeur_1',
        ville_depart: 'Libreville',
        ville_arrivee: 'Franceville',
        prix: 15000,
        vehicule: 'voiture',
        places_disponibles: 4,
        marque: 'Toyota',
        modele: 'Corolla',
        couleur: 'Blanc',
      })
    );

    // 3. Client opens the "Voyages" tab → loadVoyages()
    await useVoyagesStore.getState().loadVoyages();

    // 4. The client should see exactly one voyage, fully mapped
    const clientTrajets = useVoyagesStore.getState().trajets;
    expect(clientTrajets).toHaveLength(1);
    expect(clientTrajets[0]).toEqual(
      expect.objectContaining({
        type: 'Voiture',
        from: 'Libreville',
        to: 'Franceville',
        price: '15000 FCFA',
        icon: '🚗',
        chauffeurName: 'Pierre',
        chauffeurAvatar: 'pierre.jpg',
        chauffeurRating: 4.7,
        chauffeurProfileId: 'supa_chauffeur_1',
        placesDisponibles: 4,
        marque: 'Toyota',
        modele: 'Corolla',
        couleur: 'Blanc',
      })
    );
    // The client-side ID must be the Supabase UUID returned by insert
    expect(clientTrajets[0].id).toBe('supa-1');
  });

  it('multiple trajets from the same chauffeur all appear for the client', async () => {
    await publishTrajetAsChauffeur({ villeDepart: 'Libreville', villeArrivee: 'Port-Gentil', prix: '12000' });
    await publishTrajetAsChauffeur({ villeDepart: 'Libreville', villeArrivee: 'Oyem', prix: '20000' });
    await publishTrajetAsChauffeur({ villeDepart: 'Libreville', villeArrivee: 'Lambaréné', prix: '8000' });

    await useVoyagesStore.getState().loadVoyages();
    const clientTrajets = useVoyagesStore.getState().trajets;
    expect(clientTrajets).toHaveLength(3);

    const destinations = clientTrajets.map((t) => t.to).sort();
    expect(destinations).toEqual(['Lambaréné', 'Oyem', 'Port-Gentil']);
  });

  it('fully-booked trajets (places_disponibles === 0) are NOT returned to the client', async () => {
    // Publish a normal trajet
    await publishTrajetAsChauffeur({
      villeDepart: 'Libreville',
      villeArrivee: 'Franceville',
      placesDisponibles: '3',
    });
    // Simulate the trajet being fully booked by mutating the fake DB directly
    // (the real system would do this via updateTrajetPlaces or decrementTrajetPlaces).
    fakeTrajetsDb[0].places_disponibles = 0;

    await useVoyagesStore.getState().loadVoyages();
    expect(useVoyagesStore.getState().trajets).toHaveLength(0);
  });

  it('trajets marked as effectue are NOT returned to the client', async () => {
    await publishTrajetAsChauffeur();
    fakeTrajetsDb[0].status = 'effectue';

    await useVoyagesStore.getState().loadVoyages();
    expect(useVoyagesStore.getState().trajets).toHaveLength(0);
  });

  it('if the Supabase insert fails, the trajet does NOT appear on the client side', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    (insertTrajet as jest.Mock).mockRejectedValueOnce(new Error('DB down'));

    await publishTrajetAsChauffeur();
    await useVoyagesStore.getState().loadVoyages();

    expect(useVoyagesStore.getState().trajets).toHaveLength(0);
    // And the optimistic local copy on the chauffeur side was rolled back
    expect(useTrajetsStore.getState().trajets).toHaveLength(0);
  });
});

// =============================================================================
// Flow 2: Hebergeur publishes → Client discovery list
// =============================================================================
describe('Flow 2 — Hebergeur publishes hebergement → Client discovery list', () => {
  async function publishHebergementAsHebergeur(overrides: Partial<{
    nom: string;
    type: 'hotel' | 'auberge' | 'appartement' | 'maison' | 'chambre';
    ville: string;
    adresse: string;
    prixParNuit: string;
    capacite: string;
    description: string;
    disponible: boolean;
    disponibilite: string;
  }> = {}) {
    useHebergementsStore.setState({
      formData: {
        nom: overrides.nom ?? 'Résidence Akanda',
        type: overrides.type ?? 'appartement',
        ville: overrides.ville ?? 'Libreville',
        adresse: overrides.adresse ?? 'Bord de mer',
        prixParNuit: overrides.prixParNuit ?? '25000',
        capacite: overrides.capacite ?? '4',
        description: overrides.description ?? 'Vue sur mer, wifi, clim',
        disponible: overrides.disponible ?? true,
        disponibilite: overrides.disponibilite ?? '3',
        images: ['https://img.example/1.jpg', 'https://img.example/2.jpg'],
      },
    });
    await useHebergementsStore
      .getState()
      .addListing(
        'hebergeur_clerk_1',
        'supa_hebergeur_1',
        ['https://img.example/1.jpg', 'https://img.example/2.jpg']
      );
  }

  it('a published hebergement appears in the client discovery list with all mapped fields', async () => {
    // 1. Hebergeur publishes
    await publishHebergementAsHebergeur();

    // 2. Supabase-side: insertHebergement was called with normalized columns
    expect(insertHebergement).toHaveBeenCalledWith(
      expect.objectContaining({
        hebergeur_id: 'supa_hebergeur_1',
        nom: 'Résidence Akanda',
        type: 'appartement',
        ville: 'Libreville',
        adresse: 'Bord de mer',
        prix_par_nuit: 25000,
        capacite: 4,
        description: 'Vue sur mer, wifi, clim',
        status: 'actif',
        disponibilite: 3,
        images: ['https://img.example/1.jpg', 'https://img.example/2.jpg'],
      })
    );

    // 3. Client opens "Hébergements" tab → loadHebergements()
    await useHebergementsDiscoveryStore.getState().loadHebergements();

    // 4. The client should see exactly one listing, fully mapped
    const clientListings = useHebergementsDiscoveryStore.getState().listings;
    expect(clientListings).toHaveLength(1);
    expect(clientListings[0]).toEqual(
      expect.objectContaining({
        supabaseId: 'supa-1',
        type: 'Appart.',
        name: 'Résidence Akanda',
        location: 'Libreville',
        price: '25000 FCFA/nuit',
        prixParNuit: 25000,
        icon: '🏢',
        images: ['https://img.example/1.jpg', 'https://img.example/2.jpg'],
        hebergeurName: 'Pierre',
        hebergeurAvatar: 'pierre.jpg',
        hebergeurRating: 4.7,
        hebergeurProfileId: 'supa_hebergeur_1',
        capacite: 4,
        disponibilite: 3,
        description: 'Vue sur mer, wifi, clim',
        adresse: 'Bord de mer',
      })
    );
  });

  it('a hebergement published as "indisponible" is NOT returned to the client', async () => {
    await publishHebergementAsHebergeur({ disponible: false });

    // Sanity check: the row was inserted with status='inactif'
    expect(insertHebergement).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'inactif' })
    );

    await useHebergementsDiscoveryStore.getState().loadHebergements();
    expect(useHebergementsDiscoveryStore.getState().listings).toHaveLength(0);
  });

  it('multiple hebergements from the same hebergeur all appear for the client', async () => {
    await publishHebergementAsHebergeur({ nom: 'Hotel A', type: 'hotel' });
    await publishHebergementAsHebergeur({ nom: 'Chambre B', type: 'chambre' });
    await publishHebergementAsHebergeur({ nom: 'Maison C', type: 'maison' });

    await useHebergementsDiscoveryStore.getState().loadHebergements();
    const listings = useHebergementsDiscoveryStore.getState().listings;
    expect(listings).toHaveLength(3);

    const names = listings.map((l) => l.name).sort();
    expect(names).toEqual(['Chambre B', 'Hotel A', 'Maison C']);
  });

  it('if the Supabase insert fails, the hebergement does NOT appear on the client side', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    (insertHebergement as jest.Mock).mockRejectedValueOnce(new Error('DB down'));

    await publishHebergementAsHebergeur();
    await useHebergementsDiscoveryStore.getState().loadHebergements();

    expect(useHebergementsDiscoveryStore.getState().listings).toHaveLength(0);
    expect(useHebergementsStore.getState().listings).toHaveLength(0);
  });

  // -------------------------------------------------------------------------
  // Previously a documented design gap: hebergements with status='actif' but
  // disponibilite=0 were still returned. Fixed by adding .gt('disponibilite',0)
  // to fetchAllAvailableHebergements, symmetric with trajets' places_disponibles
  // filter.
  // -------------------------------------------------------------------------
  it('fully-booked hebergements (disponibilite=0) are NOT returned to the client', async () => {
    await publishHebergementAsHebergeur({ disponibilite: '1' });
    fakeHebergementsDb[0].disponibilite = 0; // Simulate last unit booked

    await useHebergementsDiscoveryStore.getState().loadHebergements();
    expect(useHebergementsDiscoveryStore.getState().listings).toHaveLength(0);
  });
});

// =============================================================================
// Flow 3: Push notifications emitted on trajet publication
// =============================================================================
describe('Flow 3 — Push notifications on publication', () => {
  it('publishing a trajet broadcasts a push notification to all clients', async () => {
    useTrajetsStore.setState({
      formData: {
        villeDepart: 'Libreville',
        villeArrivee: 'Port-Gentil',
        prix: '12000',
        vehicule: 'voiture',
        date: '2026-07-01T08:00:00.000Z',
        placesDisponibles: '3',
        marque: 'Toyota',
        modele: 'Hilux',
        couleur: 'Noir',
      },
    });

    await useTrajetsStore
      .getState()
      .addTrajet('chauffeur_clerk_1', 'supa_chauffeur_1');

    expect(sendPushBroadcast).toHaveBeenCalledTimes(1);
    expect(sendPushBroadcast).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'trajets',
        recipientRole: 'client',
        title: 'Nouveau trajet disponible',
        message: 'Libreville → Port-Gentil — 12000 FCFA',
        data: expect.objectContaining({
          trajetId: 'supa-1',
          type: 'new_trajet',
          villeDepart: 'Libreville',
          villeArrivee: 'Port-Gentil',
        }),
      })
    );
  });

  it('does NOT broadcast a push when the Supabase insert fails', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    (insertTrajet as jest.Mock).mockRejectedValueOnce(new Error('boom'));

    useTrajetsStore.setState({
      formData: {
        villeDepart: 'A',
        villeArrivee: 'B',
        prix: '1000',
        vehicule: 'moto',
        date: '',
        placesDisponibles: '1',
        marque: '',
        modele: '',
        couleur: '',
      },
    });
    await useTrajetsStore.getState().addTrajet('c1', 'supa_c1');

    expect(sendPushBroadcast).not.toHaveBeenCalled();
  });

  it('does NOT broadcast a push when publishing offline (no supabaseProfileId)', async () => {
    useTrajetsStore.setState({
      formData: {
        villeDepart: 'A',
        villeArrivee: 'B',
        prix: '500',
        vehicule: 'moto',
        date: '',
        placesDisponibles: '1',
        marque: '',
        modele: '',
        couleur: '',
      },
    });
    // No supabaseProfileId → purely local, no remote write, no push
    await useTrajetsStore.getState().addTrajet('chauffeur_clerk_offline');

    expect(insertTrajet).not.toHaveBeenCalled();
    expect(sendPushBroadcast).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------------------------
  // Symmetric with the trajets flow: publishing a hebergement must broadcast
  // a push notification to all clients, so they discover new listings in
  // near-real-time.
  // -------------------------------------------------------------------------
  it('publishing a hebergement broadcasts a push notification to all clients', async () => {
    useHebergementsStore.setState({
      formData: {
        nom: 'Hotel Test',
        type: 'hotel',
        ville: 'Libreville',
        adresse: 'Centre',
        prixParNuit: '18000',
        capacite: '2',
        description: 'Test',
        disponible: true,
        disponibilite: '5',
        images: [],
      },
    });

    await useHebergementsStore
      .getState()
      .addListing('hebergeur_clerk_1', 'supa_hebergeur_1', []);

    expect(sendPushBroadcast).toHaveBeenCalledTimes(1);
    expect(sendPushBroadcast).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'hebergements',
        recipientRole: 'client',
        title: 'Nouvel hébergement disponible',
        message: 'Hotel Test — Libreville — 18000 FCFA/nuit',
        data: expect.objectContaining({
          hebergementId: 'supa-1',
          type: 'new_hebergement',
          ville: 'Libreville',
          nom: 'Hotel Test',
        }),
      })
    );
  });

  it('does NOT broadcast a push when the hebergement is published as inactive', async () => {
    useHebergementsStore.setState({
      formData: {
        nom: 'Hotel Fermé',
        type: 'hotel',
        ville: 'Libreville',
        adresse: 'Centre',
        prixParNuit: '18000',
        capacite: '2',
        description: 'Test',
        disponible: false, // → status='inactif'
        disponibilite: '5',
        images: [],
      },
    });

    await useHebergementsStore
      .getState()
      .addListing('hebergeur_clerk_1', 'supa_hebergeur_1', []);

    expect(sendPushBroadcast).not.toHaveBeenCalled();
  });

  it('does NOT broadcast a push when the hebergement Supabase insert fails', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    (insertHebergement as jest.Mock).mockRejectedValueOnce(new Error('boom'));

    useHebergementsStore.setState({
      formData: {
        nom: 'Hotel Test',
        type: 'hotel',
        ville: 'Libreville',
        adresse: 'Centre',
        prixParNuit: '18000',
        capacite: '2',
        description: 'Test',
        disponible: true,
        disponibilite: '3',
        images: [],
      },
    });

    await useHebergementsStore
      .getState()
      .addListing('hebergeur_clerk_1', 'supa_hebergeur_1', []);

    expect(sendPushBroadcast).not.toHaveBeenCalled();
  });
});
