import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { sendMessage, ChatMessage as GeminiMessage } from '../lib/gemini';
import { UserRole } from '../types';

export interface ChatMessageItem {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface ChatState {
  messages: ChatMessageItem[];
  isStreaming: boolean;
  streamingContent: string;
  error: string | null;

  // Actions
  sendUserMessage: (text: string, userRole: UserRole) => Promise<void>;
  clearChat: () => void;
  dismissError: () => void;
}

const MAX_PERSISTED_MESSAGES = 50;

// Convertir nos messages au format Gemini API
function toGeminiMessages(messages: ChatMessageItem[]): GeminiMessage[] {
  return messages.map((m) => ({
    role: m.role === 'user' ? 'user' as const : 'model' as const,
    parts: [{ text: m.content }],
  }));
}

let abortController: AbortController | null = null;

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      messages: [],
      isStreaming: false,
      streamingContent: '',
      error: null,

      sendUserMessage: async (text: string, userRole: UserRole) => {
        const { isStreaming } = get();
        if (isStreaming) return;

        const userMessage: ChatMessageItem = {
          id: Date.now().toString(),
          role: 'user',
          content: text.trim(),
          timestamp: Date.now(),
        };

        set((state) => ({
          messages: [...state.messages, userMessage],
          isStreaming: true,
          streamingContent: '',
          error: null,
        }));

        abortController = new AbortController();

        try {
          const allMessages = [...get().messages];
          const geminiMessages = toGeminiMessages(allMessages);

          const fullText = await sendMessage(
            geminiMessages,
            userRole,
            (chunk) => {
              set((state) => ({
                streamingContent: state.streamingContent + chunk,
              }));
            },
            abortController.signal
          );

          const assistantMessage: ChatMessageItem = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: fullText,
            timestamp: Date.now(),
          };

          set((state) => ({
            messages: [...state.messages, assistantMessage],
            isStreaming: false,
            streamingContent: '',
          }));
        } catch (err) {
          if (err instanceof Error && err.name === 'AbortError') {
            set({ isStreaming: false, streamingContent: '' });
            return;
          }
          const errorMessage =
            err instanceof Error ? err.message : 'Une erreur est survenue';
          set({
            isStreaming: false,
            streamingContent: '',
            error: errorMessage,
          });
        } finally {
          abortController = null;
        }
      },

      clearChat: () => {
        if (abortController) {
          abortController.abort();
          abortController = null;
        }
        set({
          messages: [],
          isStreaming: false,
          streamingContent: '',
          error: null,
        });
      },

      dismissError: () => set({ error: null }),
    }),
    {
      name: 'zopgo-chat-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        // Persister uniquement les N derniers messages
        messages: state.messages.slice(-MAX_PERSISTED_MESSAGES),
      }),
    }
  )
);
