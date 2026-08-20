// Tests du depot / suppression de la photo de vehicule du chauffeur.
// Le systeme de fichiers et le SDK Storage sont mockes : aucun appel reseau.
//
// Point critique : les policies RLS du bucket `vehicle-photos` (migration 044)
// autorisent INSERT/UPDATE/DELETE uniquement si
//   (storage.foldername(name))[1] = auth.jwt() ->> 'sub'
// Autrement dit c'est le PREMIER SEGMENT du chemin qui porte la securite.
// Si ce segment cesse d'etre le clerkId, la production rejette tous les
// depots — d'ou le test dedie ci-dessous qui verrouille ce format.

jest.unmock('../supabaseVehiclePhoto');

import * as FileSystem from 'expo-file-system/legacy';
import { supabase } from '../supabase';
import { uploadVehiclePhoto, deleteVehiclePhoto } from '../supabaseVehiclePhoto';

jest.mock('expo-file-system/legacy', () => ({
  readAsStringAsync: jest.fn(),
  EncodingType: { Base64: 'base64' },
}));

// jest.setup.js ne mocke que supabase.from — on etend l'objet mock pour que
// supabase.storage.from(bucket).{upload,getPublicUrl,remove} soit appelable.
(supabase as unknown as { storage: { from: jest.Mock } }).storage = {
  from: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('uploadVehiclePhoto', () => {
  it('lit le fichier en base64, depose dans le bucket vehicle-photos et renvoie l URL publique', async () => {
    (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValueOnce('YmFzZTY0LWRhdGE=');

    const uploadMock = jest.fn().mockResolvedValueOnce({
      data: { path: 'user_123/1700000000.jpg' },
      error: null,
    });
    const getPublicUrlMock = jest.fn().mockReturnValueOnce({
      data: {
        publicUrl:
          'https://supabase/storage/v1/object/public/vehicle-photos/user_123/1700000000.jpg',
      },
    });
    (supabase.storage.from as jest.Mock).mockReturnValue({
      upload: uploadMock,
      getPublicUrl: getPublicUrlMock,
    });

    const url = await uploadVehiclePhoto('user_123', 'file:///tmp/voiture.jpg');

    expect(url).toBe(
      'https://supabase/storage/v1/object/public/vehicle-photos/user_123/1700000000.jpg'
    );
    expect(FileSystem.readAsStringAsync).toHaveBeenCalledWith('file:///tmp/voiture.jpg', {
      encoding: 'base64',
    });
    expect(supabase.storage.from).toHaveBeenCalledWith('vehicle-photos');

    const [, , options] = uploadMock.mock.calls[0];
    expect(options).toMatchObject({ contentType: 'image/jpg', upsert: true });
  });

  it('CADRAGE RLS : le premier segment du chemin est exactement le clerkId', async () => {
    (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValueOnce('YmFzZTY0');

    const uploadMock = jest.fn().mockResolvedValueOnce({
      data: { path: 'user_abc/1.png' },
      error: null,
    });
    (supabase.storage.from as jest.Mock).mockReturnValue({
      upload: uploadMock,
      getPublicUrl: jest.fn().mockReturnValue({ data: { publicUrl: 'https://x/y.png' } }),
    });

    await uploadVehiclePhoto('user_abc', 'file:///tmp/voiture.png');

    const [path] = uploadMock.mock.calls[0];
    // Format impose par la policy : {clerkId}/{timestamp}.{ext}
    expect(path).toMatch(/^user_abc\/\d+\.png$/);
    expect(String(path).split('/')[0]).toBe('user_abc');
  });

  it('conserve l extension du fichier source et ignore la query string', async () => {
    (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValueOnce('YmFzZTY0');

    const uploadMock = jest.fn().mockResolvedValueOnce({
      data: { path: 'user_q/1.png' },
      error: null,
    });
    (supabase.storage.from as jest.Mock).mockReturnValue({
      upload: uploadMock,
      getPublicUrl: jest.fn().mockReturnValue({ data: { publicUrl: 'https://x/y.png' } }),
    });

    await uploadVehiclePhoto('user_q', 'file:///tmp/voiture.png?width=800');

    const [path, , options] = uploadMock.mock.calls[0];
    expect(path).toMatch(/^user_q\/\d+\.png$/);
    expect(options).toMatchObject({ contentType: 'image/png' });
  });

  it('renvoie null si le depot Storage echoue (ex: RLS)', async () => {
    (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValueOnce('aGVsbG8=');
    (supabase.storage.from as jest.Mock).mockReturnValue({
      upload: jest.fn().mockResolvedValueOnce({ data: null, error: { message: 'rls' } }),
      getPublicUrl: jest.fn(),
    });

    expect(await uploadVehiclePhoto('user_x', 'file:///x.jpg')).toBeNull();
  });

  it('renvoie null si la lecture du fichier echoue', async () => {
    (FileSystem.readAsStringAsync as jest.Mock).mockRejectedValueOnce(new Error('fs'));

    expect(await uploadVehiclePhoto('user_x', 'file:///introuvable.jpg')).toBeNull();
  });
});

describe('deleteVehiclePhoto', () => {
  it('extrait le chemin de l URL publique et supprime le fichier', async () => {
    const removeMock = jest.fn().mockResolvedValueOnce({ error: null });
    (supabase.storage.from as jest.Mock).mockReturnValue({ remove: removeMock });

    const ok = await deleteVehiclePhoto(
      'https://supabase/storage/v1/object/public/vehicle-photos/user_123/1700000000.jpg'
    );

    expect(ok).toBe(true);
    expect(supabase.storage.from).toHaveBeenCalledWith('vehicle-photos');
    expect(removeMock).toHaveBeenCalledWith(['user_123/1700000000.jpg']);
  });

  it('renvoie false sur une URL etrangere au bucket vehicle-photos', async () => {
    const removeMock = jest.fn();
    (supabase.storage.from as jest.Mock).mockReturnValue({ remove: removeMock });

    expect(await deleteVehiclePhoto('https://example.com/autre/fichier.jpg')).toBe(false);
    expect(removeMock).not.toHaveBeenCalled();
  });

  it('renvoie false sur une URL invalide', async () => {
    const removeMock = jest.fn();
    (supabase.storage.from as jest.Mock).mockReturnValue({ remove: removeMock });

    expect(await deleteVehiclePhoto('pas-une-url')).toBe(false);
    expect(removeMock).not.toHaveBeenCalled();
  });

  it('renvoie false si Storage renvoie une erreur', async () => {
    (supabase.storage.from as jest.Mock).mockReturnValue({
      remove: jest.fn().mockResolvedValueOnce({ error: { message: 'rls' } }),
    });

    expect(await deleteVehiclePhoto('https://x/vehicle-photos/user_1/1.jpg')).toBe(false);
  });
});
