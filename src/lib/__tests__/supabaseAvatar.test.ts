// Tests focus on the pure logic — file system + Storage SDK are mocked so
// we don't actually hit the network. `generateAvatarPlaceholder` is purely
// computational and gets the most coverage.

jest.unmock('../supabaseAvatar');

import * as FileSystem from 'expo-file-system/legacy';
import { supabase } from '../supabase';
import { uploadAvatar, deleteAvatar, generateAvatarPlaceholder } from '../supabaseAvatar';

jest.mock('expo-file-system/legacy', () => ({
  readAsStringAsync: jest.fn(),
  EncodingType: { Base64: 'base64' },
}));

// jest.setup.js only mocks supabase.from — extend the mock object so storage
// is callable as supabase.storage.from(bucket).{upload,getPublicUrl,remove}.
(supabase as unknown as { storage: { from: jest.Mock } }).storage = {
  from: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('generateAvatarPlaceholder', () => {
  it('builds UI-Avatars URL with first 2 initials uppercased', () => {
    const url = generateAvatarPlaceholder('alice martin', 'user_123');
    expect(url).toMatch(/^https:\/\/ui-avatars\.com\/api\//);
    expect(url).toContain('name=AM');
  });

  it('truncates initials to 2 chars even for long names', () => {
    const url = generateAvatarPlaceholder('Alice Bob Charlie David', 'user_x');
    expect(url).toContain('name=AB');
  });

  it('handles single-word names', () => {
    const url = generateAvatarPlaceholder('Solo', 'u');
    expect(url).toContain('name=S');
  });

  it('picks a stable background color from the userId', () => {
    const a = generateAvatarPlaceholder('Alice', 'user_a');
    const b = generateAvatarPlaceholder('Bob', 'user_a');
    // Same userId → same color, even if name differs
    const colorA = new URL(a).searchParams.get('background');
    const colorB = new URL(b).searchParams.get('background');
    expect(colorA).toBe(colorB);
  });

  it('different userIds usually map to different colors', () => {
    const colors = new Set<string>();
    for (let i = 0; i < 9; i++) {
      const url = generateAvatarPlaceholder('Test', `user_${i}`);
      const c = new URL(url).searchParams.get('background');
      if (c) colors.add(c);
    }
    // Not strictly all-unique (9 colors, 9 users) but we expect spread
    expect(colors.size).toBeGreaterThan(3);
  });

  it('uses white text + bold + size=200', () => {
    const url = generateAvatarPlaceholder('X Y', 'u');
    expect(url).toContain('color=fff');
    expect(url).toContain('bold=true');
    expect(url).toContain('size=200');
  });
});

describe('uploadAvatar', () => {
  it('reads file as base64, uploads to {userId}/{ts}.{ext}, returns public URL', async () => {
    (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValueOnce('YmFzZTY0LWRhdGE=');

    const uploadMock = jest.fn().mockResolvedValueOnce({
      data: { path: 'user_123/1700000000.jpg' },
      error: null,
    });
    const getPublicUrlMock = jest.fn().mockReturnValueOnce({
      data: { publicUrl: 'https://supabase/avatars/user_123/1700000000.jpg' },
    });
    (supabase.storage.from as jest.Mock).mockReturnValue({
      upload: uploadMock,
      getPublicUrl: getPublicUrlMock,
    });

    const url = await uploadAvatar('user_123', 'file:///tmp/photo.jpg');

    expect(url).toBe('https://supabase/avatars/user_123/1700000000.jpg');
    expect(FileSystem.readAsStringAsync).toHaveBeenCalledWith(
      'file:///tmp/photo.jpg',
      { encoding: 'base64' }
    );
    const [path, _data, options] = uploadMock.mock.calls[0];
    expect(path).toMatch(/^user_123\/\d+\.jpg$/);
    expect(options).toMatchObject({ contentType: 'image/jpg', upsert: true });
  });

  it('returns null on read error', async () => {
    (FileSystem.readAsStringAsync as jest.Mock).mockRejectedValueOnce(new Error('fs'));
    const url = await uploadAvatar('user_x', 'file:///bad.jpg');
    expect(url).toBeNull();
  });

  it('returns null on storage error', async () => {
    (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValueOnce('aGVsbG8=');
    (supabase.storage.from as jest.Mock).mockReturnValue({
      upload: jest.fn().mockResolvedValueOnce({ data: null, error: { message: 'rls' } }),
      getPublicUrl: jest.fn(),
    });

    expect(await uploadAvatar('user_x', 'file:///x.jpg')).toBeNull();
  });
});

describe('deleteAvatar', () => {
  it('extracts the path from the URL and removes it', async () => {
    const removeMock = jest.fn().mockResolvedValueOnce({ error: null });
    (supabase.storage.from as jest.Mock).mockReturnValue({ remove: removeMock });

    const ok = await deleteAvatar(
      'https://supabase/storage/v1/object/public/avatars/user_123/1700000000.jpg'
    );

    expect(ok).toBe(true);
    expect(removeMock).toHaveBeenCalledWith(['user_123/1700000000.jpg']);
  });

  it('returns false when URL does not match the avatars pattern', async () => {
    const removeMock = jest.fn();
    (supabase.storage.from as jest.Mock).mockReturnValue({ remove: removeMock });
    expect(await deleteAvatar('https://example.com/other/file.jpg')).toBe(false);
    expect(removeMock).not.toHaveBeenCalled();
  });

  it('returns false on storage error', async () => {
    (supabase.storage.from as jest.Mock).mockReturnValue({
      remove: jest.fn().mockResolvedValueOnce({ error: { message: 'rls' } }),
    });
    expect(
      await deleteAvatar('https://x/avatars/u/1.jpg')
    ).toBe(false);
  });
});
