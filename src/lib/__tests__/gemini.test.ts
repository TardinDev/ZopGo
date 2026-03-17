// gemini.ts reads GEMINI_API_KEY at module load time (const), so we must
// set the env var BEFORE requiring the module, and use jest.resetModules()
// to get a fresh instance for each describe block.

beforeEach(() => {
  jest.clearAllMocks();
  jest.restoreAllMocks();
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

function loadGemini(apiKey?: string) {
  jest.resetModules();

  // Must re-mock dependencies that gemini.ts imports after resetModules
  jest.mock('@sentry/react-native', () => ({
    captureException: jest.fn(),
  }));

  if (apiKey !== undefined) {
    process.env.EXPO_PUBLIC_GEMINI_API_KEY = apiKey;
  } else {
    delete process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  }

  const mod = require('../gemini');
  return mod.sendMessage as typeof import('../gemini').sendMessage;
}

type ChatMessage = import('../gemini').ChatMessage;

const makeMessages = (text = 'Hello'): ChatMessage[] => [
  { role: 'user', parts: [{ text }] },
];

describe('sendMessage', () => {
  describe('API key validation', () => {
    it('throws when API key is missing', async () => {
      const send = loadGemini(undefined);
      await expect(send(makeMessages(), 'client')).rejects.toThrow(
        /Clé API Gemini manquante/
      );
    });

    it('throws when API key is empty string', async () => {
      const send = loadGemini('');
      await expect(send(makeMessages(), 'client')).rejects.toThrow(
        /Clé API Gemini manquante/
      );
    });
  });

  describe('non-streaming (fallback)', () => {
    let send: ReturnType<typeof loadGemini>;

    beforeEach(() => {
      send = loadGemini('test-key');
    });

    it('returns text from Gemini API', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            candidates: [{ content: { parts: [{ text: 'Bonjour!' }] } }],
          }),
      });

      const result = await send(makeMessages(), 'client');
      expect(result).toBe('Bonjour!');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('generateContent'),
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('throws on API error', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        text: () => Promise.resolve('Internal Server Error'),
      });

      await expect(send(makeMessages(), 'client')).rejects.toThrow(
        /Gemini API error 500/
      );
    });

    it('throws on empty response', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ candidates: [{ content: { parts: [] } }] }),
      });

      await expect(send(makeMessages(), 'client')).rejects.toThrow(
        /Réponse vide/
      );
    });

    it('calls onChunk with full result in fallback mode', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            candidates: [{ content: { parts: [{ text: 'Hello back' }] } }],
          }),
      });

      const onChunk = jest.fn();
      const originalRS = global.ReadableStream;
      // @ts-ignore - force fallback path
      delete global.ReadableStream;

      const result = await send(makeMessages(), 'client', onChunk);
      expect(result).toBe('Hello back');
      expect(onChunk).toHaveBeenCalledWith('Hello back');

      global.ReadableStream = originalRS;
    });

    it('passes abort signal to fetch', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            candidates: [{ content: { parts: [{ text: 'ok' }] } }],
          }),
      });

      const controller = new AbortController();
      await send(makeMessages(), 'client', undefined, controller.signal);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ signal: controller.signal })
      );
    });
  });

  describe('request body', () => {
    let send: ReturnType<typeof loadGemini>;

    beforeEach(() => {
      send = loadGemini('test-key');
    });

    it('includes system prompt for chauffeur role', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            candidates: [{ content: { parts: [{ text: 'ok' }] } }],
          }),
      });

      await send(makeMessages(), 'chauffeur');
      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(body.system_instruction.parts[0].text).toContain('TRANSPORTEURS');
    });

    it('uses client system prompt for client role', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            candidates: [{ content: { parts: [{ text: 'ok' }] } }],
          }),
      });

      await send(makeMessages(), 'client');
      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(body.system_instruction.parts[0].text).toContain('CLIENTS');
    });

    it('uses hebergeur system prompt for hebergeur role', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            candidates: [{ content: { parts: [{ text: 'ok' }] } }],
          }),
      });

      await send(makeMessages(), 'hebergeur');
      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(body.system_instruction.parts[0].text).toContain('HÉBERGEURS');
    });

    it('limits messages to last 20', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            candidates: [{ content: { parts: [{ text: 'ok' }] } }],
          }),
      });

      const messages: ChatMessage[] = Array.from({ length: 30 }, (_, i) => ({
        role: 'user' as const,
        parts: [{ text: `msg ${i}` }],
      }));

      await send(messages, 'client');
      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(body.contents).toHaveLength(20);
      expect(body.contents[0].parts[0].text).toBe('msg 10');
    });
  });

  describe('rate limiting', () => {
    it('throws when rate limit exceeded', async () => {
      const send = loadGemini('test-key');

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            candidates: [{ content: { parts: [{ text: 'ok' }] } }],
          }),
      });

      // Send 14 messages (the limit)
      for (let i = 0; i < 14; i++) {
        await send(makeMessages(`msg ${i}`), 'client');
      }

      // 15th should be rejected
      await expect(send(makeMessages('too many'), 'client')).rejects.toThrow(
        /Trop de messages/
      );
    });
  });
});
