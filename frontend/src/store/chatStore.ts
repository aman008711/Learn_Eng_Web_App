import { create } from 'zustand';
import { Conversation, Message } from '../types/chat';
import api from '../lib/axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

interface ChatState {
  conversations: Conversation[];
  activeConversationId: string | null;
  messages: Message[];
  isLoading: boolean;
  isStreaming: boolean;
  searchQuery: string;
  error: string | null;

  fetchConversations: () => Promise<void>;
  searchConversations: (query: string) => Promise<void>;
  selectConversation: (id: string) => Promise<void>;
  startNewChat: () => void;
  deleteConversation: (id: string) => Promise<void>;
  renameConversation: (id: string, title: string) => Promise<void>;
  sendMessageStream: (content: string) => Promise<void>;
  setSearchQuery: (query: string) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  activeConversationId: null,
  messages: [],
  isLoading: false,
  isStreaming: false,
  searchQuery: '',
  error: null,

  setSearchQuery: (query) => set({ searchQuery: query }),

  fetchConversations: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get<Conversation[]>('/api/v1/chat');
      set({ conversations: response.data });
    } catch (err: any) {
      set({ error: err.response?.data?.detail || 'Failed to load conversations.' });
    } finally {
      set({ isLoading: false });
    }
  },

  searchConversations: async (query) => {
    if (!query.trim()) {
      get().fetchConversations();
      return;
    }
    set({ isLoading: true, error: null });
    try {
      const response = await api.get<Conversation[]>(`/api/v1/chat/search?q=${encodeURIComponent(query)}`);
      set({ conversations: response.data });
    } catch (err: any) {
      set({ error: 'Failed to search conversations.' });
    } finally {
      set({ isLoading: false });
    }
  },

  selectConversation: async (id) => {
    set({ isLoading: true, error: null, activeConversationId: id });
    try {
      const response = await api.get<Conversation>(`/api/v1/chat/${id}`);
      set({ messages: response.data.messages || [] });
    } catch (err: any) {
      set({ error: 'Failed to load conversation history.', activeConversationId: null });
    } finally {
      set({ isLoading: false });
    }
  },

  startNewChat: () => {
    set({ activeConversationId: null, messages: [], error: null });
  },

  deleteConversation: async (id) => {
    set({ error: null });
    try {
      await api.delete(`/api/v1/chat/${id}`);
      set((state) => {
        const nextConversations = state.conversations.filter((c) => c.id !== id);
        const isActiveDeleted = state.activeConversationId === id;
        return {
          conversations: nextConversations,
          activeConversationId: isActiveDeleted ? null : state.activeConversationId,
          messages: isActiveDeleted ? [] : state.messages,
        };
      });
    } catch (err: any) {
      set({ error: 'Failed to delete conversation.' });
    }
  },

  renameConversation: async (id, title) => {
    set({ error: null });
    try {
      const response = await api.put<Conversation>(`/api/v1/chat/${id}`, { title });
      set((state) => ({
        conversations: state.conversations.map((c) => (c.id === id ? response.data : c)),
      }));
    } catch (err: any) {
      set({ error: 'Failed to rename conversation.' });
    }
  },

  sendMessageStream: async (content) => {
    const { activeConversationId, messages } = get();
    set({ isStreaming: true, error: null });

    // 1. Generate local user message
    const tempUserMsg: Message = {
      id: Math.random().toString(),
      conversation_id: activeConversationId || '',
      role: 'user',
      content,
      created_at: new Date().toISOString(),
    };

    // 2. Generate local empty assistant message placeholder to accumulate chunks
    const tempAssistantMsgId = Math.random().toString();
    const tempAssistantMsg: Message = {
      id: tempAssistantMsgId,
      conversation_id: activeConversationId || '',
      role: 'assistant',
      content: '',
      created_at: new Date().toISOString(),
    };

    // Append to UI immediately
    set({ messages: [...messages, tempUserMsg, tempAssistantMsg] });

    try {
      const token = localStorage.getItem('access_token') || '';

      // 3. Initiate SSE Streaming HTTP Request
      const response = await fetch(`${API_URL}/api/v1/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: content,
          conversation_id: activeConversationId || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error('ReadableStream not supported by browser.');

      let assistantText = '';
      let buffer = '';
      let activeId = activeConversationId;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || ''; // Keep trailing partial line in buffer

        for (const line of lines) {
          const cleanLine = line.trim();
          if (!cleanLine.startsWith('data: ')) continue;
          
          const jsonStr = cleanLine.substring(6).trim();
          if (jsonStr === '[DONE]') {
            break;
          }

          try {
            const data = JSON.parse(jsonStr);
            
            // Check if metadata event for a new conversation session
            if (data.conversation_id) {
              activeId = data.conversation_id;
              set({ activeConversationId: activeId });
              // Refresh conversations index in background
              get().fetchConversations();
            }

            // Check if text chunk content
            if (data.content) {
              assistantText += data.content;
              set((state) => ({
                messages: state.messages.map((m) =>
                  m.id === tempAssistantMsgId ? { ...m, content: assistantText, conversation_id: activeId || '' } : m
                ),
              }));
            }

            // Check if error event
            if (data.error) {
              throw new Error(data.error);
            }
          } catch (err) {
            console.error('Failed to parse SSE chunk:', err);
          }
        }
      }
    } catch (err: any) {
      set({ error: err.message || 'Stream connection lost. Please try again.' });
      // Remove the blank assistant placeholder if it has no content
      set((state) => ({
        messages: state.messages.filter((m) => m.id !== tempAssistantMsgId || m.content !== ''),
      }));
    } finally {
      set({ isStreaming: false });
      // Refresh conversations list to update titles or timestamps
      get().fetchConversations();
    }
  },
}));
