// Dépôt de la photo du véhicule depuis l'écran "Mes véhicules" (chauffeur) :
// sélection dans la galerie, envoi vers le bucket `vehicle-photos` cadré sur
// le clerkId, persistance sur le profil, et comportement en cas d'échec
// (l'aperçu précédent doit rester à l'écran).
// expo-image-picker et supabaseVehiclePhoto sont mockés globalement par
// jest.setup.js ; ce fichier ajuste leurs valeurs de résolution par test.

import React from 'react';
import { Alert } from 'react-native';
import { render, fireEvent, act } from '@testing-library/react-native';
import * as ImagePicker from 'expo-image-picker';

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), replace: jest.fn() }),
  router: { push: jest.fn(), back: jest.fn(), replace: jest.fn() },
  useLocalSearchParams: () => ({}),
}));

import { useAuthStore } from '../../../../stores/authStore';
import { useSettingsStore } from '../../../../stores/settingsStore';
import { uploadVehiclePhoto } from '../../../../lib/supabaseVehiclePhoto';
import { updateProfile as updateSupabaseProfile } from '../../../../lib/supabaseProfile';
import VehiclesEditScreen from '../vehicles-edit';

const seedChauffeur = () => {
  useAuthStore
    .getState()
    .setupProfile('chauffeur', 'QA chauffeur', 'qa.chauffeur@test.com', 'voiture', 'clerk-driver');
};

const pickPhoto = async (getByLabelText: (text: string) => any, uri: string) => {
  (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValueOnce({
    canceled: false,
    assets: [{ uri }],
  });
  await act(async () => {
    fireEvent.press(getByLabelText('Ajouter une photo du véhicule'));
  });
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  useAuthStore.setState({ user: null, clerkId: null, supabaseProfileId: null });
  useSettingsStore.setState({ vehicles: [] });
});

describe('Mes véhicules — photo du véhicule', () => {
  it('affiche le bouton d’ajout et le texte d’aide quand aucune photo n’est enregistrée', () => {
    seedChauffeur();
    const { getByText, getByLabelText } = render(<VehiclesEditScreen />);

    expect(getByLabelText('Ajouter une photo du véhicule')).toBeTruthy();
    expect(getByText('Ajouter une photo')).toBeTruthy();
    expect(
      getByText('Cette photo aide vos passagers à reconnaître votre véhicule.')
    ).toBeTruthy();
  });

  it('envoie la photo choisie au bucket sous le clerkId puis la persiste sur le profil', async () => {
    seedChauffeur();
    (uploadVehiclePhoto as jest.Mock).mockResolvedValueOnce(
      'https://cdn.zopgo/vehicle-photos/clerk-driver/1.jpg'
    );
    const { getByLabelText } = render(<VehiclesEditScreen />);

    await pickPhoto(getByLabelText, 'file:///vehicule.jpg');

    expect(ImagePicker.launchImageLibraryAsync).toHaveBeenCalledWith(
      expect.objectContaining({ aspect: [16, 9] })
    );
    expect(uploadVehiclePhoto).toHaveBeenCalledWith('clerk-driver', 'file:///vehicule.jpg');
    expect(useAuthStore.getState().user!.profile.vehiclePhotoUrl).toBe(
      'https://cdn.zopgo/vehicle-photos/clerk-driver/1.jpg'
    );
    expect(updateSupabaseProfile).toHaveBeenCalledWith('clerk-driver', {
      vehicle_photo_url: 'https://cdn.zopgo/vehicle-photos/clerk-driver/1.jpg',
    });
  });

  it('échec d’envoi — alerte l’utilisateur et conserve la photo précédente', async () => {
    seedChauffeur();
    useAuthStore.getState().updateProfile({ vehiclePhotoUrl: 'https://cdn.zopgo/ancienne.jpg' });
    (uploadVehiclePhoto as jest.Mock).mockResolvedValueOnce(null);
    const { getByLabelText } = render(<VehiclesEditScreen />);

    await pickPhoto(getByLabelText, 'file:///nouvelle.jpg');

    expect(Alert.alert).toHaveBeenCalledWith(
      'Erreur',
      expect.stringContaining("Impossible d'envoyer la photo")
    );
    expect(useAuthStore.getState().user!.profile.vehiclePhotoUrl).toBe(
      'https://cdn.zopgo/ancienne.jpg'
    );
  });

  it('permission refusée — n’ouvre pas la galerie et n’envoie rien', async () => {
    seedChauffeur();
    (ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValueOnce({
      granted: false,
      status: 'denied',
    });
    const { getByLabelText } = render(<VehiclesEditScreen />);

    await act(async () => {
      fireEvent.press(getByLabelText('Ajouter une photo du véhicule'));
    });

    expect(ImagePicker.launchImageLibraryAsync).not.toHaveBeenCalled();
    expect(uploadVehiclePhoto).not.toHaveBeenCalled();
  });

  it('sélection annulée — aucun envoi et le profil reste inchangé', async () => {
    seedChauffeur();
    (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValueOnce({
      canceled: true,
      assets: [],
    });
    const { getByLabelText } = render(<VehiclesEditScreen />);

    await act(async () => {
      fireEvent.press(getByLabelText('Ajouter une photo du véhicule'));
    });

    expect(uploadVehiclePhoto).not.toHaveBeenCalled();
    expect(useAuthStore.getState().user!.profile.vehiclePhotoUrl).toBeUndefined();
  });

  it('la zone photo est réservée aux chauffeurs', () => {
    useAuthStore.getState().setupProfile('client', 'QA client', 'qa.client@test.com');
    const { queryByLabelText } = render(<VehiclesEditScreen />);

    expect(queryByLabelText('Ajouter une photo du véhicule')).toBeNull();
  });
});
