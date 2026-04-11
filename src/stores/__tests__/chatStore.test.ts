import * as Network from 'expo-network';
import { useChatStore } from '../chatStore';
import { sendMessage } from '../../lib/gemini';

// Mock gemini module
jest.mock('../../lib/gemini', () => ({
  sendMessage: jest.fn(),
}));

beforeEach(() => {
  jest.clearAllMocks();
  // Reset store
  useChatStore.setState({
    messages: [],
    isStreaming: false,
    streamingContent: '',
    error: null,
  });
});

describe('chatStore', () => {
  describe('initial state', () => {
    it('starts with empty messages', () => {
      expect(useChatStore.getState().messages).toEqual([]);
    });

    it('starts with isStreaming false', () => {
      expect(useChatStore.getState().isStreaming).toBe(false);
    });

    it('starts with no error', () => {
      expect(useChatStore.getState().error).toBeNull();
    });
  });

  describe('sendUserMessage', () => {
    it('adds user message to list', async () => {
      (Network.getNetworkStateAsync as jest.Mock).mockResolvedValue({ isConnected: true });
      (sendMessage as jest.Mock).mockResolvedValue('Response');

      await useChatStore.getState().sendUserMessage('Hello', 'client');
      const messages = useChatStore.getState().messages;
      expect(messages).toHaveLength(2); // user + assistant
      expect(messages[0].role).toBe('user');
      expect(messages[0].content).toBe('Hello');
    });

    it('adds assistant response message', async () => {
      (Network.getNetworkStateAsync as jest.Mock).mockResolvedValue({ isConnected: true });
      (sendMessage as jest.Mock).mockResolvedValue('Bonjour!');

      await useChatStore.getState().sendUserMessage('Hello', 'client');
      const messages = useChatStore.getState().messages;
      expect(messages[1].role).toBe('assistant');
      expect(messages[1].content).toBe('Bonjour!');
    });

    it('trims user message', async () => {
      (Network.getNetworkStateAsync as jest.Mock).mockResolvedValue({ isConnected: true });
      (sendMessage as jest.Mock).mockResolvedValue('ok');

      await useChatStore.getState().sendUserMessage('  Hello  ', 'client');
      expect(useChatStore.getState().messages[0].content).toBe('Hello');
    });

    it('sets error when offline', async () => {
      (Network.getNetworkStateAsync as jest.Mock).mockResolvedValue({ type: 'NONE', isConnected: false });
      (global.fetch as jest.Mock).mockRejectedValue(new Error('offline'));

      await useChatStore.getState().sendUserMessage('Hello', 'client');
      const state = useChatStore.getState();
      expect(state.error).toContain('connexion');
      expect(state.isStreaming).toBe(false);
    });

    it('does not send when already streaming', async () => {
      useChatStore.setState({ isStreaming: true });

      await useChatStore.getState().sendUserMessage('Hello', 'client');
      expect(sendMessage).not.toHaveBeenCalled();
    });

    it('sets error on API failure', async () => {
      (Network.getNetworkStateAsync as jest.Mock).mockResolvedValue({ isConnected: true });
      (sendMessage as jest.Mock).mockRejectedValue(new Error('API fail'));

      await useChatStore.getState().sendUserMessage('Hello', 'client');
      const state = useChatStore.getState();
      expect(state.error).toBe('API fail');
      expect(state.isStreaming).toBe(false);
    });

    it('handles AbortError silently', async () => {
      (Network.getNetworkStateAsync as jest.Mock).mockResolvedValue({ isConnected: true });
      const abortError = new Error('Aborted');
      abortError.name = 'AbortError';
      (sendMessage as jest.Mock).mockRejectedValue(abortError);

      await useChatStore.getState().sendUserMessage('Hello', 'client');
      const state = useChatStore.getState();
      expect(state.error).toBeNull();
      expect(state.isStreaming).toBe(false);
    });

    it('calls sendMessage with streaming callback', async () => {
      (Network.getNetworkStateAsync as jest.Mock).mockResolvedValue({ isConnected: true });
      (sendMessage as jest.Mock).mockImplementation(
        async (_msgs: unknown, _role: unknown, onChunk: (c: string) => void) => {
          onChunk('chunk1');
          onChunk('chunk2');
          return 'chunk1chunk2';
        }
      );

      await useChatStore.getState().sendUserMessage('Hello', 'client');
      // streamingContent should be reset after completion
      expect(useChatStore.getState().streamingContent).toBe('');
    });

    it('handles non-Error exceptions', async () => {
      (Network.getNetworkStateAsync as jest.Mock).mockResolvedValue({ isConnected: true });
      (sendMessage as jest.Mock).mockRejectedValue('string error');

      await useChatStore.getState().sendUserMessage('Hello', 'client');
      expect(useChatStore.getState().error).toBe('Une erreur est survenue');
    });
  });

  describe('clearChat', () => {
    it('resets all state', async () => {
      (Network.getNetworkStateAsync as jest.Mock).mockResolvedValue({ isConnected: true });
      (sendMessage as jest.Mock).mockResolvedValue('ok');

      await useChatStore.getState().sendUserMessage('Hello', 'client');
      useChatStore.getState().clearChat();
      const state = useChatStore.getState();
      expect(state.messages).toEqual([]);
      expect(state.isStreaming).toBe(false);
      expect(state.streamingContent).toBe('');
      expect(state.error).toBeNull();
    });
  });

  describe('dismissError', () => {
    it('clears the error', () => {
      useChatStore.setState({ error: 'Some error' });
      useChatStore.getState().dismissError();
      expect(useChatStore.getState().error).toBeNull();
    });
  });

  describe('message persistence limit', () => {
    it('messages accumulate correctly', async () => {
      (Network.getNetworkStateAsync as jest.Mock).mockResolvedValue({ isConnected: true });
      (sendMessage as jest.Mock).mockResolvedValue('reply');

      await useChatStore.getState().sendUserMessage('msg1', 'client');
      await useChatStore.getState().sendUserMessage('msg2', 'client');
      expect(useChatStore.getState().messages).toHaveLength(4); // 2 user + 2 assistant
    });
  });
});
