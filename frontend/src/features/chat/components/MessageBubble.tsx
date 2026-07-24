import React, { useState } from 'react';
import { Message } from '../../../types/chat';
import { Clipboard, Check } from 'lucide-react';

interface MessageBubbleProps {
  message: Message;
}

const CopyButton: React.FC<{ text: string }> = ({ text }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      // ignore
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 text-[10px] text-slate-400 hover:text-slate-200 transition-colors focus:outline-none"
    >
      {copied ? (
        <>
          <Check className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-emerald-400">Copied!</span>
        </>
      ) : (
        <>
          <Clipboard className="w-3.5 h-3.5" />
          <span>Copy</span>
        </>
      )}
    </button>
  );
};

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user';

  // Secure lightweight markdown tokenizer
  const parseMarkdown = (text: string): React.ReactNode[] => {
    if (!text) return [];

    // Split text by triple backticks code blocks
    const parts = text.split(/```/);
    return parts.map((part, index) => {
      // Odd indexes are code blocks
      if (index % 2 === 1) {
        const lines = part.split('\n');
        const language = lines[0].trim();
        const code = lines.slice(1).join('\n').trim();
        return (
          <div key={index} className="my-3 border border-slate-700/60 rounded-xl overflow-hidden bg-[#070b13]/85 text-left">
            <div className="flex items-center justify-between px-4 py-2 bg-slate-800/40 border-b border-slate-850/80 text-[10px] font-mono text-slate-400">
              <span>{language || 'code'}</span>
              <CopyButton text={code} />
            </div>
            <pre className="p-4 text-xs font-mono text-slate-300 overflow-x-auto leading-relaxed select-text">
              <code>{code}</code>
            </pre>
          </div>
        );
      }

      // Even indexes are inline text
      const lines = part.split('\n');
      let insideList = false;
      let listItems: string[] = [];
      const elements: React.ReactNode[] = [];

      const flushList = (key: string) => {
        if (listItems.length > 0) {
          elements.push(
            <ul key={key} className="list-disc pl-5 my-2 space-y-1.5 text-left">
              {listItems.map((item, i) => (
                <li key={i} className="text-xs md:text-sm leading-relaxed text-slate-300">
                  {parseInlineFormatting(item)}
                </li>
              ))}
            </ul>
          );
          listItems = [];
          insideList = false;
        }
      };

      lines.forEach((line, lineIdx) => {
        const cleanLine = line.trim();
        
        // Detect bullet lists
        if (cleanLine.startsWith('- ') || cleanLine.startsWith('* ')) {
          insideList = true;
          listItems.push(cleanLine.substring(2));
        } else {
          if (insideList) {
            flushList(`list-${lineIdx}`);
          }
          
          if (cleanLine) {
            elements.push(
              <p key={`p-${lineIdx}`} className="my-2 text-xs md:text-sm leading-relaxed text-slate-300 text-left">
                {parseInlineFormatting(cleanLine)}
              </p>
            );
          }
        }
      });

      if (insideList) {
        flushList(`list-final`);
      }

      return <React.Fragment key={index}>{elements}</React.Fragment>;
    });
  };

  const parseInlineFormatting = (inlineText: string): React.ReactNode[] => {
    // Parse bold markdown format **text**
    const boldParts = inlineText.split(/\*\*(.*?)\*\*/g);
    return boldParts.map((item, i) => {
      if (i % 2 === 1) {
        const lower = item.toLowerCase();
        // Custom highlights for corrections
        if (lower.startsWith('correct')) {
          return <strong key={i} className="text-emerald-400 font-semibold">{item}</strong>;
        }
        if (lower.startsWith('incorrect')) {
          return <strong key={i} className="text-rose-400 font-semibold">{item}</strong>;
        }
        return <strong key={i} className="text-sky-300 font-semibold">{item}</strong>;
      }
      return item;
    });
  };

  // Format creation timestamp
  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  };

  return (
    <div className={`flex gap-3 max-w-[85%] ${isUser ? 'self-end flex-row-reverse' : 'self-start'}`}>
      {/* Avatar Indicator */}
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-md select-none shrink-0 ${
        isUser
          ? 'bg-gradient-to-tr from-indigo-500 to-purple-600 text-white'
          : 'bg-gradient-to-tr from-sky-400 to-indigo-500 text-white'
      }`}>
        {isUser ? 'U' : 'J'}
      </div>

      {/* Message Frame */}
      <div className="flex flex-col gap-1">
        <div className={`rounded-2xl px-4 py-3 shadow-lg ${
          isUser
            ? 'bg-gradient-to-br from-indigo-600 to-purple-700 text-white rounded-tr-none'
            : 'bg-[#0f172a]/60 backdrop-blur-md border border-slate-800/80 text-slate-100 rounded-tl-none'
        }`}>
          {parseMarkdown(message.content)}
        </div>
        
        {/* Timestamp */}
        <span className={`text-[10px] text-slate-500 px-1 ${isUser ? 'text-right' : 'text-left'}`}>
          {formatTime(message.created_at)}
        </span>
      </div>
    </div>
  );
};
