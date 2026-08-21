// Photo du véhicule sur le détail d'un trajet (côté client).
//
// La photo remonte du profil du chauffeur jusqu'ici via la jointure Supabase,
// le store des voyages puis les paramètres de route — exactement le chemin que
// suit déjà `chauffeurAvatar`. Ce qui est vérifié ici, c'est le bout de la
// chaîne : quand l'URL arrive, le client voit le véhicule ; quand elle est
// absente, on ne rend RIEN — ni cadre vide, ni icône générique, qui
// n'aideraient personne à reconnaître une voiture sur le trottoir.

import React from 'react';
import { render } from '@testing-library/react-native';

let mockParams: Record<string, string> = {};

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), replace: jest.fn() }),
  router: { push: jest.fn(), back: jest.fn(), replace: jest.fn() },
  useLocalSearchParams: () => mockParams,
}));

import { useAuthStore } from '../../../../stores/authStore';
import VoyageDetailScreen from '../voyage-detail';

const PHOTO_LABEL = 'Photo du véhicule';

const baseParams = {
  id: 'trajet-1',
  type: 'Voiture',
  from: 'Libreville',
  to: 'Port-Gentil',
  price: '15000 FCFA',
  icon: '🚗',
  chauffeurName: 'Jean Ondo',
  chauffeurAvatar: 'https://cdn.zopgo/avatars/jean.jpg',
  chauffeurRating: '4.8',
  chauffeurProfileId: 'supa-driver',
  placesDisponibles: '3',
  date: '2026-09-01T08:00:00.000Z',
  immatriculation: 'GA-123-LBV',
  modele: 'Toyota Corolla',
  couleur: 'Blanche',
};

beforeEach(() => {
  jest.clearAllMocks();
  mockParams = { ...baseParams };
  useAuthStore.getState().setupProfile('client', 'QA client', 'qa.client@test.com');
  useAuthStore.setState({ supabaseProfileId: 'supa-client' });
});

describe('Détail du trajet — photo du véhicule', () => {
  it('affiche la photo quand le chauffeur en a déposé une', () => {
    mockParams.vehiclePhotoUrl = 'https://cdn.zopgo/vehicle-photos/clerk-driver/1.jpg';

    const { getByLabelText } = render(<VoyageDetailScreen />);

    const photo = getByLabelText(PHOTO_LABEL);
    expect(photo).toBeTruthy();
    expect(photo.props.source).toEqual({
      uri: 'https://cdn.zopgo/vehicle-photos/clerk-driver/1.jpg',
    });
  });

  it("ne rend rien quand aucune photo n'est associée au chauffeur", () => {
    const { queryByLabelText } = render(<VoyageDetailScreen />);

    expect(queryByLabelText(PHOTO_LABEL)).toBeNull();
  });
});
