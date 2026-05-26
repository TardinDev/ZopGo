// Storage SDK + filesystem mocked — the test focuses on the path shape
// because the RLS policy on the 'agency-logos' bucket parses
// storage.foldername(name)[1] to enforce that only the owning agence may
// upload. If the prefix is wrong the upload is silently rejected with a
// 403 instead of a clear error, so this regression-tests the path.

jest.unmock('../supabaseAgencyLogo');

import * as FileSystem from 'expo-file-system/legacy';
import { supabase } from '../supabase';
import { uploadAgencyLogo, deleteAgencyLogo, setAgencyLogoUrl } from '../supabaseAgencyLogo';

jest.mock('expo-file-system/legacy', () => ({
  readAsStringAsync: jest.fn(),
  EncodingType: { Base64: 'base64' },
}));

// jest.setup.js doesn't include supabase.storage — extend the mocked client.
(supabase as unknown as { storage: { from: jest.Mock } }).storage = {
  from: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('uploadAgencyLogo', () => {
  it('prefixes the path with the profile id so the storage RLS policy passes', async () => {
    (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValueOnce('YmFzZTY0');

    const uploadMock = jest.fn().mockResolvedValueOnce({
      data: { path: 'profile-xyz/logo-1700000000.png' },
      error: null,
    });
    const getPublicUrlMock = jest.fn().mockReturnValueOnce({
      data: { publicUrl: 'https://cdn/agency-logos/profile-xyz/logo-1700000000.png' },
    });
    (supabase.storage.from as jest.Mock).mockReturnValue({
      upload: uploadMock,
      getPublicUrl: getPublicUrlMock,
    });

    const url = await uploadAgencyLogo('profile-xyz', 'file://tmp/pick.png');

    expect(supabase.storage.from).toHaveBeenCalledWith('agency-logos');
    // The first path segment MUST equal the profile id (RLS contract).
    const [pathArg] = uploadMock.mock.calls[0];
    expect(pathArg.startsWith('profile-xyz/')).toBe(true);
    expect(pathArg).toMatch(/\.png$/);
    expect(url).toBe('https://cdn/agency-logos/profile-xyz/logo-1700000000.png');
  });

  it('returns null when storage upload fails', async () => {
    (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValueOnce('Yg==');
    (supabase.storage.from as jest.Mock).mockReturnValue({
      upload: jest.fn().mockResolvedValueOnce({ data: null, error: { message: 'forbidden' } }),
      getPublicUrl: jest.fn(),
    });

    const result = await uploadAgencyLogo('profile-1', 'file://x.png');
    expect(result).toBeNull();
  });

  it('returns null when the local file read throws', async () => {
    (FileSystem.readAsStringAsync as jest.Mock).mockRejectedValueOnce(new Error('boom'));
    const result = await uploadAgencyLogo('profile-1', 'file://x.png');
    expect(result).toBeNull();
  });
});

describe('deleteAgencyLogo', () => {
  it('parses the path from a public URL and calls storage.remove', async () => {
    const removeMock = jest.fn().mockResolvedValueOnce({ error: null });
    (supabase.storage.from as jest.Mock).mockReturnValue({ remove: removeMock });

    const ok = await deleteAgencyLogo(
      'https://cdn.example/storage/v1/object/public/agency-logos/profile-1/logo.png'
    );

    expect(ok).toBe(true);
    expect(removeMock).toHaveBeenCalledWith(['profile-1/logo.png']);
  });

  it('returns false for malformed URLs (defensive)', async () => {
    const ok = await deleteAgencyLogo('not a url');
    expect(ok).toBe(false);
  });
});

describe('setAgencyLogoUrl', () => {
  it('updates profiles.agency_logo_url by clerk_id', async () => {
    const eqMock = jest.fn().mockResolvedValueOnce({ error: null });
    const updateMock = jest.fn().mockReturnValue({ eq: eqMock });
    (supabase.from as jest.Mock).mockReturnValue({ update: updateMock });

    const ok = await setAgencyLogoUrl('clerk_abc', 'https://cdn/logo.png');

    expect(ok).toBe(true);
    expect(supabase.from).toHaveBeenCalledWith('profiles');
    expect(updateMock).toHaveBeenCalledWith({ agency_logo_url: 'https://cdn/logo.png' });
    expect(eqMock).toHaveBeenCalledWith('clerk_id', 'clerk_abc');
  });

  it('returns false on Supabase error', async () => {
    const eqMock = jest.fn().mockResolvedValueOnce({ error: { message: 'rls denied' } });
    (supabase.from as jest.Mock).mockReturnValue({
      update: jest.fn().mockReturnValue({ eq: eqMock }),
    });

    const ok = await setAgencyLogoUrl('clerk_abc', null);
    expect(ok).toBe(false);
  });
});
