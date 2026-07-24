import React, { useState, useEffect } from 'react';
import { useChatStore } from '../../../store/chatStore';
import { MessageSquare, Trash2, Edit2, Check, X, Search, Plus, MessageCircle } from 'lucide-react';

export const ChatSidebar: React.FC = () => {
  const {
    conversations,
    activeConversationId,
    searchQuery,
    isLoading,
    fetchConversations,
    searchConversations,
    selectConversation,
    startNewChat,
    deleteConversation,
    renameConversation,
    setSearchQuery
  } = useChatStore();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    searchConversations(value);
  };

  const startEditing = (id: string, currentTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(id);
    setEditTitle(currentTitle);
  };

  const saveRename = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (editTitle.trim()) {
      await renameConversation(id, editTitle.trim());
    }
    setEditingId(null);
  };

  const cancelRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this chat history?')) {
      await deleteConversation(id);
    }
  };

  return (
    <div className="w-80 h-full bg-[#0b1329]/60 backdrop-blur-md border-r border-slate-800/80 flex flex-col">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-slate-800/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-sky-400" />
          <span className="font-semibold text-slate-200 tracking-wide">Conversations</span>
        </div>
        <button
          onClick={startNewChat}
          className="p-2 hover:bg-slate-800/80 hover:text-sky-400 text-slate-400 rounded-lg transition-all duration-200"
          title="Start a new chat session"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Search Block */}
      <div className="p-3">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full bg-[#080d1a]/80 text-sm text-slate-200 pl-9 pr-4 py-2 rounded-lg border border-slate-800/80 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all duration-200 placeholder:text-slate-600"
          />
        </div>
      </div>

      {/* Conversations Index */}
      <div className="flex-1 overflow-y-auto px-2 py-1 space-y-1 scrollbar-thin scrollbar-thumb-slate-800">
        {isLoading && conversations.length === 0 ? (
          <div className="p-4 text-center text-xs text-slate-500">Loading chat history...</div>
        ) : conversations.length === 0 ? (
          <div className="p-4 text-center text-xs text-slate-600 italic">No conversations found.</div>
        ) : (
          conversations.map((chat) => {
            const isActive = activeConversationId === chat.id;
            const isEditing = editingId === chat.id;

            return (
              <div
                key={chat.id}
                onClick={() => !isEditing && selectConversation(chat.id)}
                className={`group relative flex items-center justify-between px-3 py-3 rounded-xl cursor-pointer transition-all duration-150 ${
                  isActive
                    ? 'bg-sky-500/10 border border-sky-500/20 text-sky-400'
                    : 'hover:bg-slate-800/40 border border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-3 overflow-hidden pr-8">
                  <MessageSquare className={`w-4 h-4 shrink-0 ${isActive ? 'text-sky-400' : 'text-slate-500'}`} />
                  {isEditing ? (
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className="bg-[#080c14] border border-slate-700 text-xs text-slate-200 px-2 py-0.5 rounded focus:outline-none focus:border-sky-500"
                      autoFocus
                    />
                  ) : (
                    <span className="text-xs font-medium truncate">{chat.title}</span>
                  )}
                </div>

                {/* Edit/Delete Overlay Actions */}
                <div className="absolute right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 bg-inherit pl-2">
                  {isEditing ? (
                    <>
                      <button
                        onClick={(e) => saveRename(chat.id, e)}
                        className="p-1 hover:text-emerald-400 rounded transition-colors"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={cancelRename}
                        className="p-1 hover:text-rose-400 rounded transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={(e) => startEditing(chat.id, chat.title, e)}
                        className="p-1 hover:text-sky-400 rounded transition-colors"
                        title="Rename conversation"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleDelete(chat.id, e)}
                        className="p-1 hover:text-rose-400 rounded transition-colors"
                        title="Delete conversation"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
