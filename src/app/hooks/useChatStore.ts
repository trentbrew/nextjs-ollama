// @ts-nocheck
import { CoreMessage, generateId, Message } from 'ai';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { ExtendedMessage } from '@/utils/function-calling';

interface ChatSession {
  messages: ExtendedMessage[];
  createdAt: string;
}

interface State {
  base64Images: string[] | null;
  chats: Record<string, ChatSession>;
  currentChatId: string | null;
  selectedModel: string | null;
  embeddingModel: string;
  coords: { latitude: number; longitude: number } | null;
  userName: string | 'Anonymous';
  isDownloading: boolean;
  downloadProgress: number;
  downloadingModel: string | null;
  chatInputs: Record<string, string>;
}

interface Actions {
  setBase64Images: (base64Images: string[] | null) => void;
  setCurrentChatId: (chatId: string) => void;
  setSelectedModel: (selectedModel: string) => void;
  setEmbeddingModel: (model: string) => void;
  setCoords: (coords: { latitude: number; longitude: number } | null) => void;
  getChatById: (chatId: string) => ChatSession | undefined;
  getMessagesById: (chatId: string) => ExtendedMessage[];
  saveMessages: (chatId: string, messages: ExtendedMessage[]) => void;
  handleDelete: (chatId: string, messageId?: string) => void;
  setUserName: (userName: string) => void;
  startDownload: (modelName: string) => void;
  stopDownload: () => void;
  setDownloadProgress: (progress: number) => void;
  setChatInput: (chatId: string, input: string) => void;
}

// Combine our state and actions into a single store type
export type ChatStore = State & Actions;

// Keys of the State to persist
type PersistedKeys =
  | 'chats'
  | 'currentChatId'
  | 'selectedModel'
  | 'embeddingModel'
  | 'userName';

// Define the store mutators tuple for persist middleware
type Mutators = [['zustand/persist', Pick<ChatStore, PersistedKeys>]];

// Create the Zustand store with proper mutator typing for persist
const useChatStore = create<ChatStore, Mutators>()(
  persist(
    (set, get) => ({
      base64Images: null,
      chats: {},
      currentChatId: null,
      selectedModel: null,
      embeddingModel: 'openai:text-embedding-3-small',
      coords: null,
      userName: 'Anonymous',
      isDownloading: false,
      downloadProgress: 0,
      downloadingModel: null,
      chatInputs: {},

      setBase64Images: (base64Images) => set({ base64Images }),
      setUserName: (userName) => set({ userName }),
      setCurrentChatId: (chatId) => set({ currentChatId: chatId }),
      setSelectedModel: (selectedModel) => set({ selectedModel }),
      setEmbeddingModel: (model: string) => set({ embeddingModel: model }),
      setCoords: (coords) => set({ coords }),
      getChatById: (chatId) => get().chats[chatId],
      getMessagesById: (chatId) => get().chats[chatId]?.messages || [],
      saveMessages: (chatId, messages) =>
        set((state) => {
          const existingChat = state.chats[chatId];
          return {
            chats: {
              ...state.chats,
              [chatId]: {
                messages: [...messages],
                createdAt: existingChat?.createdAt || new Date().toISOString(),
              },
            },
          };
        }),
      handleDelete: (chatId, messageId) =>
        set((state) => {
          const chat = state.chats[chatId];
          if (!chat) return state;
          if (messageId) {
            const updated = chat.messages.filter((m) => m.id !== messageId);
            return {
              chats: {
                ...state.chats,
                [chatId]: { ...chat, messages: updated },
              },
            };
          }
          const { [chatId]: _, ...rest } = state.chats;
          return { chats: rest };
        }),
      startDownload: (modelName) =>
        set({
          isDownloading: true,
          downloadingModel: modelName,
          downloadProgress: 0,
        }),
      stopDownload: () =>
        set({
          isDownloading: false,
          downloadingModel: null,
          downloadProgress: 0,
        }),
      setDownloadProgress: (progress) => set({ downloadProgress: progress }),
      setChatInput: (chatId, input) =>
        set((state) => ({
          chatInputs: { ...state.chatInputs, [chatId]: input },
        })),
    }),
    {
      name: 'nextjs-ollama-ui-state',
      partialize: (state) => ({
        chats: state.chats,
        currentChatId: state.currentChatId,
        selectedModel: state.selectedModel,
        embeddingModel: state.embeddingModel,
        userName: state.userName,
      }),
    },
  ),
);

export default useChatStore;
