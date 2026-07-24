import React, { useState, useRef, useEffect } from 'react';
import { useChatStore } from '../../store/chatStore';
import { ChatSidebar } from './components/ChatSidebar';
import { MessageBubble } from './components/MessageBubble';
import { TypingIndicator } from './components/TypingIndicator';
import { Send, ArrowLeft, RefreshCw, MessageSquareDashed } from 'lucide-react';
import { Link } from 'react-router-dom';

export const ChatInterface: React.FC = () => {
  const {
    messages,
    activeConversationId,
    conversations,
    isLoading,
    isStreaming,
    error,
    sendMessageStream,
    fetchConversations
  } = useChatStore();

  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Load conversations once on mount
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Scroll to bottom when messages or streaming states update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  // Find active conversation title
  const activeConversation = conversations.find(c => c.id === activeConversationId);
  const headerTitle = activeConversation ? activeConversation.title : 'New Coach Conversation';

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;
    
    const textToSend = input.trim();
    setInput('');
    await sendMessageStream(textToSend);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  return (
    <div className="w-full h-screen flex bg-[#080c14] overflow-hidden text-slate-100">
      {/* Sidebar Panel */}
      <ChatSidebar />

      {/* Main Chat Stream Panel */}
      <div className="flex-1 h-full flex flex-col bg-[#080d19]/40 relative">
        
        {/* Header bar */}
        <div className="px-6 py-4 border-b border-slate-800/80 bg-[#0b1329]/40 backdrop-blur-md flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/dashboard"
              className="p-2 hover:bg-slate-850 hover:text-sky-400 text-slate-400 rounded-lg transition-all duration-200 lg:hidden"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h2 className="text-sm font-semibold text-slate-200 truncate max-w-[200px] md:max-w-md">
                {headerTitle}
              </h2>
              <span className="text-[10px] text-slate-500 tracking-wider">
                {isStreaming ? 'Coach Jarvis is typing...' : 'Active Tutoring Mode'}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Link
              to="/dashboard"
              className="px-3 py-1.5 hidden lg:flex items-center gap-1.5 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 text-xs font-medium rounded-lg text-slate-300 hover:text-slate-100 transition-all duration-200"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Dashboard
            </Link>
          </div>
        </div>

        {/* Messages Scrolling Hub */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 flex flex-col scrollbar-thin scrollbar-thumb-slate-800">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl text-center shadow-md">
              {error}
            </div>
          )}

          {isLoading && messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 gap-2">
              <RefreshCw className="w-6 h-6 animate-spin text-sky-400" />
              <span className="text-xs">Retrieving coach logs...</span>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-600 gap-4">
              <div className="w-16 h-16 rounded-full bg-slate-800/30 flex items-center justify-center border border-slate-800/80">
                <MessageSquareDashed className="w-8 h-8 text-slate-500" />
              </div>
              <div className="text-center max-w-sm">
                <h3 className="text-sm font-semibold text-slate-400 mb-1">Start English Practice</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Type your first message below. Coach Jarvis will review your phrasing, correct your spelling/grammar, and practice conversation with you!
                </p>
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))
          )}

          {/* Typing Bouncer */}
          {isStreaming && messages.length > 0 && messages[messages.length - 1].content === '' && (
            <TypingIndicator />
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Message Prompt Input Block */}
        <div className="p-4 bg-gradient-to-t from-[#080c14] to-transparent border-t border-slate-800/40">
          <form onSubmit={handleSend} className="max-w-4xl mx-auto relative flex items-end gap-3 bg-[#0c142c]/80 border border-slate-800/80 rounded-2xl p-2.5 shadow-xl focus-within:border-sky-500 focus-within:ring-1 focus-within:ring-sky-500 transition-all duration-200">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message here... (Press Enter to send, Shift+Enter for new line)"
              rows={1}
              className="flex-1 bg-transparent border-none text-slate-200 text-xs md:text-sm pl-2 pr-10 focus:outline-none resize-none max-h-32 min-h-[24px] scrollbar-none py-1 align-bottom leading-relaxed"
              style={{ height: 'auto' }}
            />
            <button
              type="submit"
              disabled={!input.trim() || isStreaming}
              className={`p-2.5 rounded-xl shadow-md transition-all duration-200 flex items-center justify-center select-none ${
                input.trim() && !isStreaming
                  ? 'bg-gradient-to-tr from-sky-400 to-indigo-500 hover:shadow-sky-500/20 text-white cursor-pointer active:scale-95'
                  : 'bg-slate-800 text-slate-600 cursor-not-allowed'
              }`}
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          <div className="max-w-4xl mx-auto mt-2 px-2 flex justify-between text-[10px] text-slate-600">
            <span>Jarvis AI Coach v1.0</span>
            <span>Local Database Synced</span>
          </div>
        </div>

      </div>
    </div>
  );
};
export default ChatInterface;
