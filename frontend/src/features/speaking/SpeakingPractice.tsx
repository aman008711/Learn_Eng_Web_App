import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSpeakingStore } from '../../store/speakingStore';
import {
  Mic,
  VolumeX,
  Clock,
  MessageCircle,
  AlertCircle,
  GraduationCap,
  Award,
  ChevronRight,
  Eye,
  EyeOff
} from 'lucide-react';

export default function SpeakingPractice() {
  const navigate = useNavigate();
  const {
    conversationId,
    messages,
    status,
    isLoading,
    error,
    durationSeconds,
    turnsCompleted,
    setStatus,
    incrementDuration,
    resetSession,
    sendMessage,
    submitSession,
    clearError
  } = useSpeakingStore();

  // Component local states
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [showCorrections, setShowCorrections] = useState(true);
  const [activeTranscript, setActiveTranscript] = useState('');
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [xpReward, setXpReward] = useState<number | null>(null);

  // Web Speech API references
  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<any>(null);

  // Initialize Speech Recognition on mount
  useEffect(() => {
    resetSession();
    
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setPermissionError("Your browser does not support Speech Recognition. Please try using Google Chrome, Microsoft Edge, or Safari.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true; // Show interim text while talking
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setStatus('recording');
        setPermissionError(null);
        setActiveTranscript('Listening... Speak now');
        clearError();
      };

      recognition.onresult = (event: any) => {
        let interimText = '';
        let finalText = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalText += event.results[i][0].transcript;
          } else {
            interimText += event.results[i][0].transcript;
          }
        }

        if (finalText) {
          setActiveTranscript(finalText);
          handleVoiceSubmitted(finalText);
        } else {
          setActiveTranscript(interimText || 'Listening... Speak now');
        }
      };

      recognition.onerror = (event: any) => {
        console.error("Speech Recognition Error:", event.error);
        if (event.error === 'not-allowed') {
          setPermissionError("Microphone access is blocked. Please enable microphone permissions in your browser address bar/settings.");
        } else if (event.error === 'no-speech') {
          setActiveTranscript('No speech detected. Please try again.');
        } else {
          setPermissionError(`Speech recognition failed: ${event.error}`);
        }
        setStatus('idle');
      };

      recognition.onend = () => {
        // If it ended and status is still recording, reset to idle
        useSpeakingStore.setState((state) => {
          if (state.status === 'recording') {
            return { status: 'idle' };
          }
          return {};
        });
      };

      recognitionRef.current = recognition;
    } catch (e: any) {
      setPermissionError(`Failed to initialize speech recognition: ${e.message}`);
    }

    return () => {
      stopSessionTimer();
      cancelSpeech();
    };
  }, []);

  // Handle active session timer
  useEffect(() => {
    if (conversationId && status !== 'idle' && !showSummaryModal) {
      startSessionTimer();
    } else {
      stopSessionTimer();
    }
  }, [conversationId, status, showSummaryModal]);

  const startSessionTimer = () => {
    if (timerRef.current) return;
    timerRef.current = setInterval(() => {
      incrementDuration(1);
    }, 1000);
  };

  const stopSessionTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  // Browser TTS playback
  const speakResponse = (text: string) => {
    if (!('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel(); // Stop any current speech
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.95;

    utterance.onstart = () => {
      setStatus('speaking');
    };

    utterance.onend = () => {
      setStatus('idle');
      setActiveTranscript('');
    };

    utterance.onerror = () => {
      setStatus('idle');
    };

    window.speechSynthesis.speak(utterance);
  };

  const cancelSpeech = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

  // Voice record toggles
  const handleMicClick = () => {
    if (status === 'recording') {
      recognitionRef.current?.stop();
    } else if (status === 'speaking') {
      cancelSpeech();
      setStatus('idle');
    } else {
      cancelSpeech();
      setActiveTranscript('');
      try {
        recognitionRef.current?.start();
      } catch (e) {
        recognitionRef.current?.stop();
        setTimeout(() => recognitionRef.current?.start(), 300);
      }
    }
  };

  const handleVoiceSubmitted = async (text: string) => {
    if (!text.trim()) return;
    try {
      const aiReply = await sendMessage(text);
      // Wait slightly and speak the response
      setTimeout(() => speakResponse(aiReply), 500);
    } catch (e) {
      // error handled in store
    }
  };

  const handleFinishSession = async () => {
    cancelSpeech();
    stopSessionTimer();
    const xp = await submitSession();
    setXpReward(xp);
    setShowSummaryModal(true);
  };

  const formatTimer = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Gather corrections made in this session
  const corrections = messages
    .filter((m) => m.role === 'assistant' && m.correction)
    .map((m) => ({ word: m.content.substring(0, 15) + '...', correction: m.correction }));

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 animate-fade-in relative">
      
      {/* Concentric Circle Animation Styles */}
      <style>{`
        @keyframes pulse-ring-recording {
          0% {
            transform: scale(0.9);
            box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.6);
          }
          70% {
            transform: scale(1.05);
            box-shadow: 0 0 0 25px rgba(239, 68, 68, 0);
          }
          100% {
            transform: scale(0.9);
            box-shadow: 0 0 0 0 rgba(239, 68, 68, 0);
          }
        }
        @keyframes pulse-speaking-cyan {
          0%, 100% {
            transform: scale(1);
            box-shadow: 0 0 20px rgba(14, 165, 233, 0.4);
          }
          50% {
            transform: scale(1.06);
            box-shadow: 0 0 35px rgba(14, 165, 233, 0.7);
          }
        }
        @keyframes rotate-border {
          100% {
            transform: rotate(360deg);
          }
        }
        .animate-ring-recording {
          animation: pulse-ring-recording 2s infinite ease-in-out;
        }
        .animate-speaking-cyan {
          animation: pulse-speaking-cyan 2.5s infinite ease-in-out;
        }
      `}</style>

      {/* Hero Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary-400 via-sky-400 to-accent-purple tracking-tight flex items-center gap-3">
            <Mic className="h-8 w-8 text-primary-400 animate-pulse" />
            Speaking Practice
          </h1>
          <p className="text-sm text-slate-400 mt-1.5 max-w-xl">
            Have a real-time vocal conversation with Jarvis AI. Improve pronunciation, practice speaking naturally, and receive spelling corrections.
          </p>
        </div>

        {conversationId && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-slate-900 border border-white/5 px-3 py-1.5 rounded-xl text-xs font-mono text-slate-350">
              <Clock className="h-4 w-4 text-primary-400" />
              <span>{formatTimer(durationSeconds)}</span>
            </div>
            <button
              onClick={handleFinishSession}
              className="py-2 px-5 bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs rounded-xl shadow-md active:scale-95 transition-all uppercase tracking-wider"
            >
              Finish Session
            </button>
          </div>
        )}
      </div>

      {permissionError && (
        <div className="glass-panel p-4 rounded-xl border border-rose-500/20 bg-rose-950/10 text-rose-350 flex items-center gap-3 text-sm animate-shake">
          <AlertCircle className="h-5 w-5 flex-shrink-0 text-rose-450" />
          <div className="flex-1 text-left">{permissionError}</div>
        </div>
      )}

      {error && (
        <div className="glass-panel p-4 rounded-xl border border-rose-500/20 bg-rose-950/10 text-rose-300 flex items-center gap-3 text-sm animate-shake">
          <AlertCircle className="h-5 w-5 flex-shrink-0 text-rose-400" />
          <div className="flex-1 text-left">{error}</div>
          <button
            onClick={clearError}
            className="text-xs text-rose-400 hover:text-rose-300 font-semibold underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Panel Canvas Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left column - Visualizer Canvas */}
        <div className="lg:col-span-2 space-y-6 flex flex-col items-center">
          
          <div className="glass-panel w-full py-16 px-6 rounded-3xl border border-white/5 flex flex-col items-center justify-center space-y-8 relative overflow-hidden bg-white/1 min-h-[420px]">
            {/* Visual background atmospheric elements */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-80 w-80 bg-primary-500/5 rounded-full filter blur-3xl pointer-events-none" />

            {/* Immersive Circular Visualizer Container */}
            <div className="relative flex items-center justify-center">
              
              {/* Spinning thinking loading ring */}
              {status === 'thinking' && (
                <div className="absolute h-44 w-44 rounded-full border-2 border-dashed border-primary-500/30 animate-spin" />
              )}

              {/* Status Action Button */}
              <button
                onClick={handleMicClick}
                disabled={isLoading && status === 'thinking'}
                className={`relative z-10 h-36 w-36 rounded-full flex flex-col items-center justify-center border shadow-xl transition-all duration-350 focus:outline-none ${
                  status === 'recording'
                    ? 'border-rose-500 bg-rose-500/25 text-rose-400 animate-ring-recording'
                    : status === 'speaking'
                    ? 'border-primary-500 bg-primary-500/20 text-primary-400 animate-speaking-cyan'
                    : 'border-white/10 bg-white/3 text-slate-300 hover:scale-103 hover:border-primary-500/30'
                }`}
              >
                {status === 'recording' ? (
                  <>
                    <Mic className="h-10 w-10 animate-pulse text-rose-400" />
                    <span className="text-[10px] font-extrabold uppercase tracking-widest mt-2 text-rose-400">Stop Recording</span>
                  </>
                ) : status === 'speaking' ? (
                  <>
                    <VolumeX className="h-10 w-10 text-primary-400" />
                    <span className="text-[10px] font-extrabold uppercase tracking-widest mt-2 text-primary-400">Skip Speaking</span>
                  </>
                ) : status === 'thinking' ? (
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="h-8 w-8 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Thinking...</span>
                  </div>
                ) : (
                  <>
                    <Mic className="h-10 w-10 text-primary-400" />
                    <span className="text-[10px] font-extrabold uppercase tracking-widest mt-2 text-slate-400">Tap to Talk</span>
                  </>
                )}
              </button>
            </div>

            {/* Captions Text area */}
            <div className="w-full max-w-lg text-center space-y-2 select-text">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">
                {status === 'recording' ? 'Live Transcription' : status === 'speaking' ? 'Jarvis AI Spoken Reply' : 'Status'}
              </span>
              <p className={`text-base font-semibold leading-relaxed min-h-[48px] ${
                status === 'recording' ? 'text-rose-400 italic' : status === 'speaking' ? 'text-primary-400' : 'text-slate-400'
              }`}>
                {activeTranscript || (status === 'recording' ? 'Listening...' : status === 'thinking' ? 'Analyzing your words...' : 'Tap the microphone to start speaking.')}
              </p>
            </div>

          </div>
          
        </div>

        {/* Right column - Script logs Timeline */}
        <div className="glass-panel w-full p-6 rounded-3xl border border-white/5 space-y-4 max-h-[500px] flex flex-col">
          
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h3 className="text-sm font-bold text-slate-350 uppercase tracking-widest flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-slate-400" />
              Dialogue Transcript
            </h3>
            
            {messages.some((m) => m.role === 'assistant' && m.correction) && (
              <button
                onClick={() => setShowCorrections(!showCorrections)}
                className="flex items-center gap-1.5 text-xs text-slate-450 hover:text-slate-300 font-semibold transition-colors"
              >
                {showCorrections ? (
                  <>
                    <EyeOff className="h-3.5 w-3.5" />
                    <span>Hide Corrections</span>
                  </>
                ) : (
                  <>
                    <Eye className="h-3.5 w-3.5" />
                    <span>Show Corrections</span>
                  </>
                )}
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-4 custom-scrollbar min-h-[300px]">
            {messages.length > 0 ? (
              messages.map((m, idx) => {
                const isAI = m.role === 'assistant';
                return (
                  <div key={idx} className={`space-y-2 select-text text-left max-w-[85%] ${isAI ? 'self-start' : 'self-end text-right ml-auto'}`}>
                    <div className={`p-4.5 rounded-2xl text-sm leading-relaxed ${
                      isAI 
                        ? 'bg-slate-950/60 border border-white/5 text-slate-200' 
                        : 'bg-primary-500/10 border border-primary-500/20 text-primary-300'
                    }`}>
                      {m.content}
                    </div>

                    {isAI && m.correction && showCorrections && (
                      <div className="p-3 bg-emerald-950/10 border border-emerald-500/10 rounded-xl text-xs text-emerald-400 text-left animate-slide-down flex items-start gap-2 select-text font-medium">
                        <GraduationCap className="h-4 w-4 flex-shrink-0 text-emerald-500 mt-0.5" />
                        <div>
                          <strong className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Grammar feedback</strong>
                          {m.correction}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 text-xs py-20">
                Your transcript feed will render here.
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Summaries Metrics Reward Modal */}
      {showSummaryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="glass-panel p-8 rounded-3xl border border-white/10 max-w-md w-full text-center space-y-6 relative overflow-hidden animate-scale-up">
            
            {/* Sparkles effect */}
            <div className="absolute -top-10 -right-10 h-32 w-32 bg-primary-500/10 rounded-full filter blur-2xl pointer-events-none" />

            <Award className="h-16 w-16 text-amber-500 mx-auto animate-bounce" />

            <div className="space-y-2">
              <h3 className="text-2xl font-black text-slate-100">Practice Completed!</h3>
              <p className="text-sm text-slate-400">
                You successfully completed an English conversation practice session.
              </p>
            </div>

            {/* Metrics List */}
            <div className="grid grid-cols-2 gap-4 border-y border-white/5 py-4">
              <div className="space-y-1">
                <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest">Duration</span>
                <span className="text-lg font-black text-slate-200">{formatTimer(durationSeconds)}</span>
              </div>
              <div className="space-y-1">
                <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest">Turns Completed</span>
                <span className="text-lg font-black text-slate-200">{turnsCompleted} messages</span>
              </div>
            </div>

            {/* Experience points block */}
            {xpReward !== null && xpReward > 0 && (
              <div className="p-3 bg-emerald-950/15 border border-emerald-500/20 rounded-2xl font-extrabold text-sm text-emerald-400 tracking-wider flex items-center justify-center gap-2 uppercase">
                <span>✨ Earned +{xpReward} XP!</span>
              </div>
            )}

            {/* Corrections review box */}
            {corrections.length > 0 && (
              <div className="space-y-2 text-left">
                <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest">Corrections Made</span>
                <div className="max-h-24 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar text-xs">
                  {corrections.map((c, idx) => (
                    <div key={idx} className="p-2 bg-slate-950/40 rounded border border-white/5 text-slate-350 leading-relaxed font-semibold">
                      {c.correction}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => {
                setShowSummaryModal(false);
                navigate('/');
              }}
              className="glass-button w-full font-bold text-xs py-3 uppercase tracking-wider flex items-center justify-center gap-2"
            >
              <span>Claim Reward</span>
              <ChevronRight className="h-4 w-4" />
            </button>

          </div>
        </div>
      )}

    </div>
  );
}
