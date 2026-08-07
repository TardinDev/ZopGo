// Chargement d'image à la création d'un hébergement (formulaire "Nouveau
// logement" de mes-hebergements.tsx) : sélection, limite de 5 photos,
// exigence d'au moins une photo pour publier, et gestion des échecs
// d'upload (partiel → publication avec avertissement, total → publication
// bloquée). Le lib supabaseHebergementImages et expo-image-picker sont
// mockés globalement par jest.setup.js ; ce fichier ajuste leurs valeurs
// de résolution par test.

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import * as ImagePicker from 'expo-image-picker';

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), replace: jest.fn() }),
  router: { push: jest.fn(), back: jest.fn(), replace: jest.fn() },
  useLocalSearchParams: () => ({}),
}));

jest.mock('@react-navigation/native', () => ({
  useFocusEffect: jest.fn(),
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn().mockResolvedValue(undefined),
  notificationAsync: jest.fn().mockResolvedValue(undefined),
  selectionAsync: jest.fn().mockResolvedValue(undefined),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
  NotificationFeedbackType: { Success: 'success', Error: 'error', Warning: 'warning' },
}));

jest.mock('../../../../hooks/useSupabaseSubscription', () => ({
  useSupabaseSubscription: jest.fn(),
}));

import { TabAnimationProvider } from '../../../../hooks/useTabAnimation';
import { useAuthStore } from '../../../../stores/authStore';
import { useHebergementsStore } from '../../../../stores/hebergementsStore';
import { useToastStore } from '../../../../stores/toastStore';
import { insertHebergement } from '../../../../lib/supabaseHebergements';
import { uploadHebergementImage } from '../../../../lib/supabaseHebergementImages';
import MesHebergementsScreen from '../mes-hebergements';

const renderScreen = () =>
  render(
    <TabAnimationProvider>
      <MesHebergementsScreen />
    </TabAnimationProvider>
  );

const seedHebergeur = () => {
  useAuthStore
    .getState()
    .setupProfile('hebergeur', 'QA hébergeur', 'qa.hebergeur@test.com', undefined, undefined, 'hotel');
  useAuthStore.setState({ supabaseProfileId: 'supa_hebergeur' });
};

const fillRequiredFields = (getByPlaceholderText: (text: string) => any) => {
  fireEvent.changeText(getByPlaceholderText('Ex: Villa Soleil'), 'Villa Test');
  fireEvent.changeText(getByPlaceholderText('Ex: Lomé'), 'Libreville');
  fireEvent.changeText(getByPlaceholderText('15000'), '20000');
  fireEvent.changeText(getByPlaceholderText('Décrivez votre logement...'), 'Un logement de test.');
};

const pickOnePhoto = async (getByLabelText: (text: string) => any, uri: string) => {
  (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValueOnce({
    canceled: false,
    assets: [{ uri }],
  });
  await act(async () => {
    fireEvent.press(getByLabelText('Ajouter une photo'));
  });
};

beforeEach(() => {
  jest.clearAllMocks();
  useAuthStore.setState({ user: null, clerkId: null, supabaseProfileId: null });
  useHebergementsStore.getState().resetForm();
  useHebergementsStore.setState({ listings: [] });
  useToastStore.setState({ toasts: [] });
});

describe('Mes logements — upload de photo à la création', () => {
  it('sélectionner une photo l’ajoute au formulaire comme couverture', async () => {
    seedHebergeur();
    const { getByText, getByLabelText } = renderScreen();

    await pickOnePhoto(getByLabelText, 'file:///photo1.jpg');

    expect(getByText('Photos (1/5)')).toBeTruthy();
    expect(getByText('Couverture')).toBeTruthy();
  });

  it('la limite de 5 photos masque le bouton d’ajout', () => {
    seedHebergeur();
    useHebergementsStore.setState({
      formData: {
        ...useHebergementsStore.getState().formData,
        images: ['a.jpg', 'b.jpg', 'c.jpg', 'd.jpg', 'e.jpg'],
      },
    });

    const { getByText, queryByLabelText } = renderScreen();

    expect(getByText('Photos (5/5)')).toBeTruthy();
    expect(queryByLabelText('Ajouter une photo')).toBeNull();
  });

  it('publier sans aucune photo est refusé et n’appelle jamais l’upload', async () => {
    seedHebergeur();
    const { getByText, getByPlaceholderText } = renderScreen();
    fillRequiredFields(getByPlaceholderText);

    await act(async () => {
      fireEvent.press(getByText('Ajouter le logement'));
    });

    expect(uploadHebergementImage).not.toHaveBeenCalled();
    expect(insertHebergement).not.toHaveBeenCalled();
    expect(useToastStore.getState().toasts.some((t) => t.title === 'Photo requise')).toBe(true);
  });

  it('publier avec une photo l’envoie au storage puis crée le logement avec son URL publique', async () => {
    seedHebergeur();
    (uploadHebergementImage as jest.Mock).mockResolvedValueOnce('https://cdn.zopgo/photo1.jpg');
    const { getByText, getByPlaceholderText, getByLabelText } = renderScreen();
    fillRequiredFields(getByPlaceholderText);
    await pickOnePhoto(getByLabelText, 'file:///photo1.jpg');

    await act(async () => {
      fireEvent.press(getByText('Ajouter le logement'));
    });

    await waitFor(() => expect(insertHebergement).toHaveBeenCalled());
    expect(uploadHebergementImage).toHaveBeenCalledWith(expect.any(String), 'file:///photo1.jpg');
    expect(insertHebergement).toHaveBeenCalledWith(
      expect.objectContaining({ images: ['https://cdn.zopgo/photo1.jpg'] })
    );
    expect(useToastStore.getState().toasts.some((t) => t.type === 'success')).toBe(true);
  });

  it('échec partiel — publie avec les photos réussies et prévient pour celles perdues', async () => {
    seedHebergeur();
    (uploadHebergementImage as jest.Mock)
      .mockResolvedValueOnce('https://cdn.zopgo/ok.jpg')
      .mockResolvedValueOnce(null);
    const { getByText, getByPlaceholderText, getByLabelText } = renderScreen();
    fillRequiredFields(getByPlaceholderText);
    await pickOnePhoto(getByLabelText, 'file:///ok.jpg');
    await pickOnePhoto(getByLabelText, 'file:///ko.jpg');

    await act(async () => {
      fireEvent.press(getByText('Ajouter le logement'));
    });

    await waitFor(() => expect(insertHebergement).toHaveBeenCalled());
    expect(insertHebergement).toHaveBeenCalledWith(
      expect.objectContaining({ images: ['https://cdn.zopgo/ok.jpg'] })
    );
    expect(
      useToastStore.getState().toasts.some((t) => t.title === 'Certaines photos manquent')
    ).toBe(true);
  });

  it('échec total des uploads — bloque la publication sans créer le logement', async () => {
    seedHebergeur();
    (uploadHebergementImage as jest.Mock).mockResolvedValueOnce(null);
    const { getByText, getByPlaceholderText, getByLabelText } = renderScreen();
    fillRequiredFields(getByPlaceholderText);
    await pickOnePhoto(getByLabelText, 'file:///bad.jpg');

    await act(async () => {
      fireEvent.press(getByText('Ajouter le logement'));
    });

    await waitFor(() => expect(uploadHebergementImage).toHaveBeenCalled());
    expect(insertHebergement).not.toHaveBeenCalled();
    expect(useToastStore.getState().toasts.some((t) => t.title === 'Photos non envoyées')).toBe(true);
  });
});
