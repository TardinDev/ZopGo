jest.unmock('../supabaseHebergementImages');

import * as FileSystem from 'expo-file-system/legacy';
import { supabase } from '../supabase';
import {
  uploadHebergementImage,
  deleteHebergementImage,
  updateHebergementImages,
} from '../supabaseHebergementImages';

jest.mock('expo-file-system/legacy', () => ({
  readAsStringAsync: jest.fn(),
  EncodingType: { Base64: 'base64' },
}));

// supabase mock in jest.setup.js only exposes .from() — add .storage here
(supabase as unknown as { storage: { from: jest.Mock } }).storage = {
  from: jest.fn(),
};

function chain(resolved: { data: unknown; error: unknown }) {
  const c: Record<string, jest.Mock> & { then?: jest.Mock } = {};
  for (const m of ['select', 'update', 'eq']) {
    c[m] = jest.fn().mockReturnValue(c);
  }
  c.then = jest.fn((res: (v: unknown) => unknown, rej?: (e: unknown) => unknown) =>
    Promise.resolve(resolved).then(res, rej)
  );
  return c;
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('uploadHebergementImage', () => {
  it('uploads to bucket=hebergements with upsert=false (each photo gets a unique key)', async () => {
    (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValueOnce('YmFzZTY0');
    const uploadMock = jest.fn().mockResolvedValueOnce({
      data: { path: 'h-1/1700000000.jpg' },
      error: null,
    });
    const getPublicUrlMock = jest.fn().mockReturnValueOnce({
      data: { publicUrl: 'https://supabase/heb/h-1/1700000000.jpg' },
    });
    (supabase.storage.from as jest.Mock).mockReturnValue({
      upload: uploadMock,
      getPublicUrl: getPublicUrlMock,
    });

    const url = await uploadHebergementImage('h-1', 'file:///tmp/photo.jpg');

    expect(url).toBe('https://supabase/heb/h-1/1700000000.jpg');
    const [path, _, options] = uploadMock.mock.calls[0];
    expect(path).toMatch(/^h-1\/\d+\.jpg$/);
    expect(options.upsert).toBe(false);
    expect(supabase.storage.from).toHaveBeenCalledWith('hebergements');
  });

  it('returns null when storage fails', async () => {
    (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValueOnce('YmFzZTY0');
    (supabase.storage.from as jest.Mock).mockReturnValue({
      upload: jest.fn().mockResolvedValueOnce({ data: null, error: { message: 'rls' } }),
      getPublicUrl: jest.fn(),
    });

    expect(await uploadHebergementImage('h-1', 'file:///x.jpg')).toBeNull();
  });

  it('returns null on fs read error', async () => {
    (FileSystem.readAsStringAsync as jest.Mock).mockRejectedValueOnce(new Error('eio'));
    expect(await uploadHebergementImage('h-1', 'file:///bad.jpg')).toBeNull();
  });
});

describe('deleteHebergementImage', () => {
  it('extracts the path under /hebergements/ and removes it', async () => {
    const removeMock = jest.fn().mockResolvedValueOnce({ error: null });
    (supabase.storage.from as jest.Mock).mockReturnValue({ remove: removeMock });

    const ok = await deleteHebergementImage(
      'https://supabase/storage/v1/object/public/hebergements/h-1/1700.jpg'
    );
    expect(ok).toBe(true);
    expect(removeMock).toHaveBeenCalledWith(['h-1/1700.jpg']);
  });

  it('returns false when URL is not in the hebergements bucket', async () => {
    const removeMock = jest.fn();
    (supabase.storage.from as jest.Mock).mockReturnValue({ remove: removeMock });
    expect(await deleteHebergementImage('https://x/other/file.jpg')).toBe(false);
    expect(removeMock).not.toHaveBeenCalled();
  });
});

describe('updateHebergementImages', () => {
  it('updates images column scoped by id', async () => {
    const c = chain({ data: null, error: null });
    (supabase.from as jest.Mock).mockReturnValue(c);

    const ok = await updateHebergementImages('h-1', ['url1', 'url2']);
    expect(ok).toBe(true);
    expect(c.update).toHaveBeenCalledWith({ images: ['url1', 'url2'] });
    expect(c.eq).toHaveBeenCalledWith('id', 'h-1');
  });

  it('returns false on error', async () => {
    const c = chain({ data: null, error: { message: 'rls' } });
    (supabase.from as jest.Mock).mockReturnValue(c);
    expect(await updateHebergementImages('h-1', [])).toBe(false);
  });
});
