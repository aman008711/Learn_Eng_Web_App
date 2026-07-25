import React, { useState, useEffect } from 'react';
import { useGrammarStore } from '../../store/grammarStore';
import { 
  Sparkles, 
  Trash2, 
  Copy, 
  Check, 
  BookOpen, 
  FileText, 
  HelpCircle, 
  Clock, 
  AlertCircle,
  MessageSquare
} from 'lucide-react';

export default function GrammarChecker() {
  const {
    history,
    activeRecord,
    isLoading,
    error,
    checkText,
    loadHistory,
    deleteRecord,
    setActiveRecord,
    clearError
  } = useGrammarStore();

  const [inputText, setInputText] = useState('');
  const [activeTab, setActiveTab] = useState<'diff' | 'explanation' | 'alternatives'>('diff');
  const [copiedCorrected, setCopiedCorrected] = useState(false);

  // Load past queries list on mount
  useEffect(() => {
    loadHistory();
  }, []);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    try {
      await checkText(inputText);
      setActiveTab('diff');
    } catch (err) {
      // error handled in store
    }
  };

  const handleCopyCorrected = async () => {
    if (!activeRecord) return;
    try {
      await navigator.clipboard.writeText(activeRecord.corrected_text);
      setCopiedCorrected(true);
      setTimeout(() => setCopiedCorrected(false), 2000);
    } catch (e) {
      // ignore
    }
  };

  // Secure lightweight markdown tokenizer for inline formatting
  const parseInlineFormatting = (inlineText: string): React.ReactNode[] => {
    // 1. Split by bold **text**
    const boldParts = inlineText.split(/\*\*(.*?)\*\*/g);
    return boldParts.flatMap((boldPart, boldIdx) => {
      // Bold block (usually additions/corrections)
      if (boldIdx % 2 === 1) {
        return [<strong key={`b-${boldIdx}`} className="text-emerald-400 font-bold bg-emerald-950/20 px-1 py-0.5 rounded border border-emerald-500/10">{boldPart}</strong>];
      }
      
      // 2. Split by strikethrough ~~text~~ (usually mistakes/removals)
      const strikeParts = boldPart.split(/~~(.*?)~~/g);
      return strikeParts.map((strikePart, strikeIdx) => {
        if (strikeIdx % 2 === 1) {
          return (
            <span key={`s-${boldIdx}-${strikeIdx}`} className="line-through text-rose-400 bg-rose-950/30 px-1 py-0.5 rounded decoration-rose-500/50 font-medium">
              {strikePart}
            </span>
          );
        }
        return strikePart;
      });
    });
  };

  // Secure lightweight markdown block parser for explanations
  const parseMarkdown = (text: string): React.ReactNode[] => {
    if (!text) return [];
    
    // Split by code blocks first
    const parts = text.split(/```/);
    return parts.map((part, index) => {
      // Code block
      if (index % 2 === 1) {
        const lines = part.split('\n');
        const code = lines.slice(1).join('\n').trim();
        return (
          <pre key={index} className="my-3 p-4 bg-slate-950/80 rounded-xl font-mono text-xs text-slate-300 border border-white/5 overflow-x-auto leading-relaxed">
            <code>{code}</code>
          </pre>
        );
      }

      // Standard text with lines
      const lines = part.split('\n');
      let insideList = false;
      let listItems: string[] = [];
      const elements: React.ReactNode[] = [];

      const flushList = (key: string) => {
        if (listItems.length > 0) {
          elements.push(
            <ul key={key} className="list-disc pl-5 my-2.5 space-y-1.5">
              {listItems.map((item, i) => (
                <li key={i} className="text-sm text-slate-300 leading-relaxed">
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
        const clean = line.trim();
        if (clean.startsWith('### ')) {
          flushList(`list-${lineIdx}`);
          elements.push(
            <h4 key={`h3-${lineIdx}`} className="text-base font-bold text-slate-100 mt-4 mb-2 flex items-center gap-2">
              {parseInlineFormatting(clean.substring(4))}
            </h4>
          );
        } else if (clean.startsWith('## ')) {
          flushList(`list-${lineIdx}`);
          elements.push(
            <h3 key={`h2-${lineIdx}`} className="text-lg font-bold text-slate-100 mt-5 mb-2.5 flex items-center gap-2">
              {parseInlineFormatting(clean.substring(3))}
            </h3>
          );
        } else if (clean.startsWith('- ') || clean.startsWith('* ')) {
          insideList = true;
          listItems.push(clean.substring(2));
        } else {
          if (insideList) {
            flushList(`list-${lineIdx}`);
          }
          if (clean) {
            elements.push(
              <p key={`p-${lineIdx}`} className="my-2 text-sm text-slate-300 leading-relaxed">
                {parseInlineFormatting(clean)}
              </p>
            );
          }
        }
      });

      if (insideList) {
        flushList('list-final');
      }

      return <React.Fragment key={index}>{elements}</React.Fragment>;
    });
  };

  const formatDate = (isoStr: string) => {
    try {
      const date = new Date(isoStr);
      return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-fade-in">
      {/* Hero Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary-400 via-sky-400 to-accent-purple tracking-tight flex items-center gap-3">
            <Sparkles className="h-8 w-8 text-primary-400 animate-pulse" />
            Grammar Checker
          </h1>
          <p className="text-sm text-slate-400 mt-1.5 max-w-xl">
            Type or paste your English text to correct spelling mistakes, identify grammar errors, and explore professional alternatives.
          </p>
        </div>
      </div>

      {error && (
        <div className="glass-panel p-4 rounded-xl border border-rose-500/20 bg-rose-950/10 text-rose-300 flex items-center gap-3 text-sm animate-shake">
          <AlertCircle className="h-5 w-5 flex-shrink-0 text-rose-400" />
          <div className="flex-1">{error}</div>
          <button 
            onClick={clearError}
            className="text-xs text-rose-400 hover:text-rose-300 font-semibold underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Columns - Inputs and Results */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Input Card */}
          <div className="glass-panel p-6 rounded-2xl shadow-glass border border-white/5 relative overflow-hidden">
            <form onSubmit={handleAnalyze} className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-sm font-bold text-slate-200 uppercase tracking-widest">
                  Your English Text
                </label>
                <span className="text-xs text-slate-500">
                  {inputText.length} characters
                </span>
              </div>

              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="e.g. He go to school yesterday and he learn english..."
                className="w-full h-36 bg-slate-950/50 border border-white/10 rounded-xl p-4 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/30 transition-all text-sm resize-none font-medium leading-relaxed"
                maxLength={1000}
              />

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isLoading || !inputText.trim()}
                  className="glass-button py-2.5 px-6 font-semibold text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <div className="h-4 w-4 border-2 border-slate-300 border-t-transparent rounded-full animate-spin" />
                      <span>Checking...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      <span>Verify Grammar</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Results Card */}
          {activeRecord ? (
            <div className="glass-panel rounded-2xl shadow-glass border border-white/5 overflow-hidden flex flex-col">
              {/* Tab Navigation */}
              <div className="flex border-b border-white/5 bg-white/2 px-4 py-2 gap-2">
                <button
                  onClick={() => setActiveTab('diff')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                    activeTab === 'diff'
                      ? 'bg-primary-500/10 text-primary-400 border border-primary-500/20'
                      : 'text-slate-400 hover:text-slate-200 border border-transparent'
                  }`}
                >
                  <FileText className="h-4 w-4" />
                  Corrections
                </button>
                <button
                  onClick={() => setActiveTab('explanation')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                    activeTab === 'explanation'
                      ? 'bg-primary-500/10 text-primary-400 border border-primary-500/20'
                      : 'text-slate-400 hover:text-slate-200 border border-transparent'
                  }`}
                >
                  <BookOpen className="h-4 w-4" />
                  Explanation
                </button>
                <button
                  onClick={() => setActiveTab('alternatives')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                    activeTab === 'alternatives'
                      ? 'bg-primary-500/10 text-primary-400 border border-primary-500/20'
                      : 'text-slate-400 hover:text-slate-200 border border-transparent'
                  }`}
                >
                  <MessageSquare className="h-4 w-4" />
                  Alternatives
                </button>
              </div>

              {/* Tab Details */}
              <div className="p-6 min-h-[160px] bg-slate-900/10">
                
                {/* Corrections & Diff Tab */}
                {activeTab === 'diff' && (
                  <div className="space-y-6">
                    {/* Visual Highlights */}
                    <div className="space-y-2">
                      <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                        Mistakes Highlighted
                      </span>
                      <div className="p-4 bg-slate-950/45 border border-white/5 rounded-xl text-slate-200 text-sm leading-relaxed select-text font-medium text-left">
                        {parseInlineFormatting(activeRecord.mistakes_highlighted)}
                      </div>
                    </div>

                    {/* Corrected Text Output */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                          Corrected Sentence
                        </span>
                        <button
                          onClick={handleCopyCorrected}
                          className="flex items-center gap-1 text-[10px] font-semibold text-primary-400 hover:text-primary-300 transition-colors"
                        >
                          {copiedCorrected ? (
                            <>
                              <Check className="h-3.5 w-3.5 text-emerald-400" />
                              <span className="text-emerald-400">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3.5 w-3.5" />
                              <span>Copy Sentence</span>
                            </>
                          )}
                        </button>
                      </div>
                      <div className="p-4 bg-emerald-950/10 border border-emerald-500/10 rounded-xl text-emerald-300 text-sm font-semibold leading-relaxed select-text text-left">
                        {activeRecord.corrected_text}
                      </div>
                    </div>
                  </div>
                )}

                {/* Explanation Tab */}
                {activeTab === 'explanation' && (
                  <div className="text-left space-y-2 select-text">
                    <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">
                      Grammatical Analysis
                    </span>
                    {parseMarkdown(activeRecord.explanation)}
                  </div>
                )}

                {/* Better Phrasings Tab */}
                {activeTab === 'alternatives' && (
                  <div className="space-y-4">
                    <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest text-left">
                      Recommended Phrasings
                    </span>
                    <div className="flex flex-col gap-3">
                      {activeRecord.alternatives.map((alt, idx) => (
                        <div 
                          key={idx} 
                          className="p-4 bg-slate-950/30 border border-white/5 rounded-xl hover:border-primary-500/20 hover:bg-slate-950/50 transition-all flex items-start gap-3 select-text text-left"
                        >
                          <span className="flex items-center justify-center h-6 w-6 rounded-lg bg-primary-500/10 text-primary-400 text-xs font-extrabold flex-shrink-0">
                            {idx + 1}
                          </span>
                          <p className="text-sm text-slate-200 font-semibold leading-relaxed pt-0.5">
                            {alt}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            </div>
          ) : (
            <div className="glass-panel p-12 rounded-2xl border border-dashed border-white/10 flex flex-col items-center justify-center text-center space-y-4 bg-white/1">
              <HelpCircle className="h-12 w-12 text-slate-600 animate-bounce" />
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-300">No Analysis Active</h3>
                <p className="text-xs text-slate-500 max-w-sm">
                  Enter a sentence and click "Verify Grammar" above to initiate a real-time linguistic critique.
                </p>
              </div>
            </div>
          )}

        </div>

        {/* Right Column - History Logs */}
        <div className="space-y-4">
          <div className="flex justify-between items-center text-left">
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
              <Clock className="h-4 w-4 text-slate-400" />
              Check History
            </h3>
            <span className="px-2 py-0.5 rounded-full bg-slate-800 border border-white/5 text-[10px] font-bold text-slate-400">
              {history.length} checks
            </span>
          </div>

          <div className="flex flex-col gap-3 max-h-[560px] overflow-y-auto pr-1 custom-scrollbar">
            {history.length > 0 ? (
              history.map((record) => {
                const isActive = activeRecord?.id === record.id;
                return (
                  <div
                    key={record.id}
                    onClick={() => {
                      setActiveRecord(record);
                      setActiveTab('diff');
                    }}
                    className={`glass-panel p-4 rounded-xl border transition-all text-left flex gap-3 group relative cursor-pointer active:scale-98 ${
                      isActive 
                        ? 'border-primary-500/40 bg-primary-500/5 shadow-glass' 
                        : 'border-white/5 bg-white/2 hover:bg-white/5 hover:border-white/10'
                    }`}
                  >
                    <div className="flex-1 space-y-2 overflow-hidden">
                      <p className="text-xs text-slate-400 font-medium truncate">
                        {record.original_text}
                      </p>
                      <p className="text-xs text-emerald-400 font-semibold truncate">
                        {record.corrected_text}
                      </p>
                      <span className="block text-[9px] text-slate-500 font-medium">
                        {formatDate(record.created_at)}
                      </span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteRecord(record.id);
                      }}
                      className="h-7 w-7 rounded-lg border border-transparent hover:border-rose-500/20 hover:bg-rose-500/10 text-slate-500 hover:text-rose-400 flex items-center justify-center transition-all self-center text-left"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                );
              })
            ) : (
              <div className="glass-panel p-8 rounded-xl border border-dashed border-white/5 text-center text-slate-500 text-xs py-12 bg-white/1">
                Your historical checks will be saved here.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
