import { useState, useEffect } from 'react';
import { useVocabStore } from '../../store/vocabStore';
import {
  Sparkles,
  Volume2,
  Bookmark,
  BookmarkCheck,
  Trash2,
  CheckCircle2,
  XCircle,
  Award,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  GraduationCap
} from 'lucide-react';

export default function VocabularyBuilder() {
  const {
    dailyWord,
    bookmarks,
    quizQuestions,
    isLoading,
    error,
    loadDailyWord,
    loadBookmarks,
    bookmarkWord,
    removeBookmark,
    fetchQuiz,
    submitQuizScore,
    clearError
  } = useVocabStore();

  const [activeTab, setActiveTab] = useState<'daily' | 'bookmarks' | 'quiz'>('daily');
  const [expandedBookmarkId, setExpandedBookmarkId] = useState<string | null>(null);

  // Quiz States
  const [quizStarted, setQuizStarted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [answerEvaluated, setAnswerEvaluated] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [xpEarned, setXpEarned] = useState<number | null>(null);

  // Load Daily Word and Bookmarks on mount
  useEffect(() => {
    loadDailyWord();
    loadBookmarks();
  }, []);

  const handleBookmarkToggle = async () => {
    if (!dailyWord) return;
    const isSaved = bookmarks.some((b) => b.word.toLowerCase() === dailyWord.word.toLowerCase());
    
    if (isSaved) {
      const match = bookmarks.find((b) => b.word.toLowerCase() === dailyWord.word.toLowerCase());
      if (match) {
        await removeBookmark(match.id);
      }
    } else {
      try {
        await bookmarkWord(dailyWord);
      } catch (e) {
        // error logged in store
      }
    }
  };

  const speakWord = (text: string) => {
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleStartQuiz = async () => {
    await fetchQuiz();
    setQuizStarted(true);
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setAnswerEvaluated(false);
    setQuizScore(0);
    setXpEarned(null);
  };

  const handleOptionSelect = (optionIdx: number) => {
    if (answerEvaluated) return;
    setSelectedOption(optionIdx);
  };

  const handleEvaluateAnswer = () => {
    if (selectedOption === null || answerEvaluated) return;
    
    const currentQuestion = quizQuestions[currentQuestionIndex];
    if (selectedOption === currentQuestion.correct_answer) {
      setQuizScore((prev) => prev + 1);
    }
    setAnswerEvaluated(true);
  };

  const handleNextQuestion = async () => {
    if (currentQuestionIndex < quizQuestions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedOption(null);
      setAnswerEvaluated(false);
    } else {
      // Quiz complete! Submit score to backend
      const xp = await submitQuizScore(quizScore, quizQuestions.length);
      setXpEarned(xp);
      setCurrentQuestionIndex((prev) => prev + 1); // Triggers final summary view
    }
  };

  const isWordSaved = (wordName: string) => {
    return bookmarks.some((b) => b.word.toLowerCase() === wordName.toLowerCase());
  };


  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary-400 via-sky-400 to-accent-purple tracking-tight flex items-center gap-3">
            <GraduationCap className="h-8 w-8 text-primary-400 animate-pulse" />
            Vocabulary Builder
          </h1>
          <p className="text-sm text-slate-400 mt-1.5 max-w-xl">
            Expand your lexicon. Master phonetic pronunciation, review custom saved bookmarks, and challenge yourself with contextual quizzes.
          </p>
        </div>
      </div>

      {error && (
        <div className="glass-panel p-4 rounded-xl border border-rose-500/20 bg-rose-950/10 text-rose-350 flex items-center gap-3 text-sm animate-shake">
          <AlertCircle className="h-5 w-5 flex-shrink-0 text-rose-450" />
          <div className="flex-1">{error}</div>
          <button
            onClick={clearError}
            className="text-xs text-rose-400 hover:text-rose-300 font-semibold underline focus:outline-none"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex border-b border-white/5 pb-0.5 gap-2">
        <button
          onClick={() => setActiveTab('daily')}
          className={`px-5 py-3 rounded-t-xl text-xs font-extrabold uppercase tracking-wider transition-all border-b-2 -mb-0.5 flex items-center gap-2 ${
            activeTab === 'daily'
              ? 'border-primary-500 text-primary-400 bg-white/2'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/1'
          }`}
        >
          <Sparkles className="h-4 w-4" />
          Word of the Day
        </button>
        <button
          onClick={() => setActiveTab('bookmarks')}
          className={`px-5 py-3 rounded-t-xl text-xs font-extrabold uppercase tracking-wider transition-all border-b-2 -mb-0.5 flex items-center gap-2 ${
            activeTab === 'bookmarks'
              ? 'border-primary-500 text-primary-400 bg-white/2'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/1'
          }`}
        >
          <Bookmark className="h-4 w-4" />
          My Bookmarks ({bookmarks.length})
        </button>
        <button
          onClick={() => {
            setActiveTab('quiz');
            setQuizStarted(false);
          }}
          className={`px-5 py-3 rounded-t-xl text-xs font-extrabold uppercase tracking-wider transition-all border-b-2 -mb-0.5 flex items-center gap-2 ${
            activeTab === 'quiz'
              ? 'border-primary-500 text-primary-400 bg-white/2'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/1'
          }`}
        >
          <Award className="h-4 w-4" />
          Practice Quiz
        </button>
      </div>

      {/* Tab Workspaces */}
      <div className="min-h-[400px]">

        {/* Tab 1: Daily Word */}
        {activeTab === 'daily' && (
          <div className="max-w-3xl mx-auto">
            {isLoading && !dailyWord ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <div className="h-8 w-8 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Generating Word...</span>
              </div>
            ) : dailyWord ? (
              <div className="glass-panel p-8 rounded-3xl shadow-glass border border-white/5 space-y-6 relative overflow-hidden">
                
                {/* Accent Backdrop Gradients */}
                <div className="absolute top-0 right-0 h-40 w-40 bg-primary-500/5 rounded-full filter blur-3xl pointer-events-none" />

                {/* Word & IPA row */}
                <div className="flex items-center justify-between gap-4 border-b border-white/5 pb-4">
                  <div className="space-y-1">
                    <h2 className="text-3xl font-black text-slate-100 flex items-center gap-3">
                      {dailyWord.word}
                      <button
                        onClick={() => speakWord(dailyWord.word)}
                        className="p-1.5 rounded-lg border border-white/5 bg-white/2 text-slate-400 hover:text-slate-200 active:scale-95 transition-all"
                        title="Listen Pronunciation"
                      >
                        <Volume2 className="h-4 w-4" />
                      </button>
                    </h2>
                    {dailyWord.pronunciation && (
                      <span className="text-xs font-mono text-primary-400 bg-primary-500/10 px-2 py-0.5 rounded border border-primary-500/20">
                        {dailyWord.pronunciation}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={handleBookmarkToggle}
                    disabled={isLoading}
                    className={`p-3 rounded-full border transition-all ${
                      isWordSaved(dailyWord.word)
                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                        : 'border-white/10 bg-white/3 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {isWordSaved(dailyWord.word) ? (
                      <BookmarkCheck className="h-5 w-5" />
                    ) : (
                      <Bookmark className="h-5 w-5" />
                    )}
                  </button>
                </div>

                {/* Meaning */}
                <div className="space-y-2">
                  <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    Definition / Meaning
                  </span>
                  <p className="text-base text-slate-200 leading-relaxed font-semibold">
                    {dailyWord.meaning}
                  </p>
                </div>

                {/* Examples */}
                <div className="space-y-2.5">
                  <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    Context Examples
                  </span>
                  <div className="flex flex-col gap-2">
                    {dailyWord.examples.map((ex, idx) => (
                      <div key={idx} className="p-3.5 bg-slate-950/40 border border-white/5 rounded-xl text-slate-300 text-sm leading-relaxed italic">
                        "{ex}"
                      </div>
                    ))}
                  </div>
                </div>

                {/* Synonyms & Antonyms grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-white/5">
                  <div className="space-y-2.5">
                    <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      Synonyms
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {dailyWord.synonyms.map((syn, idx) => (
                        <span key={idx} className="px-2.5 py-1 bg-white/2 hover:bg-white/5 border border-white/5 rounded-lg text-xs font-semibold text-sky-400 select-text">
                          {syn}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      Antonyms
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {dailyWord.antonyms.map((ant, idx) => (
                        <span key={idx} className="px-2.5 py-1 bg-white/2 hover:bg-white/5 border border-white/5 rounded-lg text-xs font-semibold text-rose-450 select-text">
                          {ant}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            ) : (
              <div className="text-center py-20 text-slate-500">
                Word could not be loaded. Please check your network connection.
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Bookmarks List */}
        {activeTab === 'bookmarks' && (
          <div className="max-w-4xl mx-auto space-y-4">
            {bookmarks.length > 0 ? (
              <div className="flex flex-col gap-3">
                {bookmarks.map((b) => {
                  const isExpanded = expandedBookmarkId === b.id;
                  return (
                    <div
                      key={b.id}
                      className={`glass-panel border rounded-2xl overflow-hidden transition-all duration-300 ${
                        isExpanded ? 'border-primary-500/30 bg-primary-500/1' : 'border-white/5 bg-white/2 hover:border-white/10'
                      }`}
                    >
                      {/* Header Summary Row */}
                      <div
                        onClick={() => setExpandedBookmarkId(isExpanded ? null : b.id)}
                        className="p-5 flex items-center justify-between gap-4 cursor-pointer select-none"
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          <h3 className="text-lg font-black text-slate-200 truncate">
                            {b.word}
                          </h3>
                          {b.pronunciation && (
                            <span className="text-[10px] font-mono text-primary-400 bg-primary-500/10 px-1.5 py-0.5 rounded flex-shrink-0">
                              {b.pronunciation}
                            </span>
                          )}
                          <p className="text-xs text-slate-400 truncate max-w-sm hidden md:block">
                            {b.meaning}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              speakWord(b.word);
                            }}
                            className="h-8 w-8 rounded-lg border border-white/5 bg-white/3 text-slate-400 hover:text-slate-200 flex items-center justify-center transition-all"
                          >
                            <Volume2 className="h-4 w-4" />
                          </button>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeBookmark(b.id);
                            }}
                            className="h-8 w-8 rounded-lg border border-transparent hover:border-rose-500/20 hover:bg-rose-500/10 text-slate-500 hover:text-rose-450 flex items-center justify-center transition-all"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                          
                          <div className="text-slate-500">
                            {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                          </div>
                        </div>
                      </div>

                      {/* Expandable Details Pane */}
                      {isExpanded && (
                        <div className="px-5 pb-5 pt-1 border-t border-white/5 space-y-4 animate-slide-down">
                          
                          {/* Expanded definition on mobile */}
                          <div className="space-y-1 md:hidden">
                            <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                              Definition
                            </span>
                            <p className="text-sm text-slate-300 leading-relaxed font-semibold">
                              {b.meaning}
                            </p>
                          </div>

                          {/* Synonyms & Antonyms */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                                Synonyms
                              </span>
                              <div className="flex flex-wrap gap-1">
                                {b.synonyms.map((syn, idx) => (
                                  <span key={idx} className="px-2 py-0.5 bg-white/2 border border-white/5 rounded text-xs text-sky-400">
                                    {syn}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <div className="space-y-1.5">
                              <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                                Antonyms
                              </span>
                              <div className="flex flex-wrap gap-1">
                                {b.antonyms.map((ant, idx) => (
                                  <span key={idx} className="px-2 py-0.5 bg-white/2 border border-white/5 rounded text-xs text-rose-450">
                                    {ant}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Examples */}
                          <div className="space-y-1.5">
                            <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                              Example Sentences
                            </span>
                            <ul className="list-disc pl-4 space-y-1">
                              {b.examples.map((ex, idx) => (
                                <li key={idx} className="text-xs text-slate-350 italic">
                                  "{ex}"
                                </li>
                              ))}
                            </ul>
                          </div>

                        </div>
                      )}

                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="glass-panel p-12 rounded-2xl border border-dashed border-white/10 text-center flex flex-col items-center justify-center py-20 gap-4 bg-white/1">
                <Bookmark className="h-12 w-12 text-slate-600 animate-bounce" />
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-300">No Bookmarks Saved</h3>
                  <p className="text-xs text-slate-500 max-w-sm">
                    Bookmarks saved from the "Word of the Day" panel will load here to build your personal vocabulary ledger.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Interactive Practice Quiz */}
        {activeTab === 'quiz' && (
          <div className="max-w-2xl mx-auto">
            {!quizStarted ? (
              <div className="glass-panel p-8 rounded-3xl border border-white/5 text-center space-y-6">
                <Award className="h-14 w-14 text-amber-500 mx-auto animate-bounce" />
                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-slate-100">Vocabulary Quiz Challenge</h3>
                  <p className="text-sm text-slate-400 max-w-md mx-auto">
                    Challenge yourself with a 5-question vocabulary review. Completing the quiz awards experience points (XP) to level up your dashboard stats!
                  </p>
                  {bookmarks.length >= 3 ? (
                    <span className="inline-block text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full uppercase tracking-wider">
                      ✨ Powered by your bookmarked words
                    </span>
                  ) : (
                    <span className="inline-block text-[10px] font-bold text-slate-400 bg-slate-800 border border-white/5 px-3 py-1 rounded-full uppercase tracking-wider">
                      General advanced vocabulary quiz
                    </span>
                  )}
                </div>

                <button
                  onClick={handleStartQuiz}
                  disabled={isLoading}
                  className="glass-button font-bold text-sm px-8 py-3 disabled:opacity-50"
                >
                  {isLoading ? 'Assembling quiz questions...' : 'Launch Quiz'}
                </button>
              </div>
            ) : (
              // Quiz in progress
              <div className="glass-panel p-6 rounded-3xl border border-white/5 space-y-6">
                {currentQuestionIndex < quizQuestions.length ? (
                  // Active Question
                  <>
                    {/* Header Progress */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase tracking-wider">
                        <span>Question {currentQuestionIndex + 1} of {quizQuestions.length}</span>
                        <span>Score: {quizScore} / {currentQuestionIndex}</span>
                      </div>
                      {/* Progress Bar */}
                      <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden border border-white/5">
                        <div
                          className="h-full bg-gradient-to-r from-primary-500 to-sky-400 transition-all duration-300"
                          style={{ width: `${((currentQuestionIndex) / quizQuestions.length) * 100}%` }}
                        />
                      </div>
                    </div>

                    {/* Question text */}
                    <div className="p-5 bg-slate-950/40 border border-white/5 rounded-2xl">
                      <h4 className="text-base font-bold text-slate-200 leading-relaxed text-left">
                        {quizQuestions[currentQuestionIndex].question}
                      </h4>
                    </div>

                    {/* Choices Grid */}
                    <div className="flex flex-col gap-3">
                      {quizQuestions[currentQuestionIndex].options.map((opt, idx) => {
                        const isSelected = selectedOption === idx;
                        const isCorrect = idx === quizQuestions[currentQuestionIndex].correct_answer;
                        
                        let optionStyle = "border-white/5 bg-white/2 hover:bg-white/5 hover:border-white/10";
                        if (answerEvaluated) {
                          if (isCorrect) {
                            optionStyle = "border-emerald-500/40 bg-emerald-500/5 text-emerald-300";
                          } else if (isSelected) {
                            optionStyle = "border-rose-500/40 bg-rose-500/5 text-rose-350";
                          } else {
                            optionStyle = "border-white/5 bg-white/1 opacity-50";
                          }
                        } else if (isSelected) {
                          optionStyle = "border-primary-500/50 bg-primary-500/10 text-primary-400";
                        }

                        return (
                          <button
                            key={idx}
                            onClick={() => handleOptionSelect(idx)}
                            disabled={answerEvaluated}
                            className={`p-4 rounded-xl border text-left font-semibold text-sm transition-all duration-200 active:scale-99 flex items-center justify-between gap-3 ${optionStyle}`}
                          >
                            <span>{opt}</span>
                            {answerEvaluated && isCorrect && <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0" />}
                            {answerEvaluated && isSelected && !isCorrect && <XCircle className="h-5 w-5 text-rose-450 flex-shrink-0" />}
                          </button>
                        );
                      })}
                    </div>

                    {/* Feedback and Explanations */}
                    {answerEvaluated && (
                      <div className="p-4 bg-slate-950/70 border border-white/5 rounded-2xl space-y-2 text-left animate-slide-down animate-fade-in">
                        <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                          Linguistic Analysis
                        </span>
                        <p className="text-xs text-slate-350 leading-relaxed font-semibold">
                          {quizQuestions[currentQuestionIndex].explanation}
                        </p>
                      </div>
                    )}

                    {/* Step Actions */}
                    <div className="flex justify-end pt-2">
                      {!answerEvaluated ? (
                        <button
                          onClick={handleEvaluateAnswer}
                          disabled={selectedOption === null}
                          className="glass-button py-2 px-6 font-bold text-xs uppercase tracking-wider disabled:opacity-50"
                        >
                          Verify Answer
                        </button>
                      ) : (
                        <button
                          onClick={handleNextQuestion}
                          className="glass-button py-2 px-6 font-bold text-xs uppercase tracking-wider"
                        >
                          {currentQuestionIndex < quizQuestions.length - 1 ? 'Next Question' : 'View Results'}
                        </button>
                      )}
                    </div>
                  </>
                ) : (
                  // Quiz Finished Summary
                  <div className="text-center py-6 space-y-6 animate-fade-in">
                    <Award className="h-16 w-16 text-amber-400 mx-auto animate-bounce" />
                    
                    <div className="space-y-2">
                      <h3 className="text-2xl font-black text-slate-100">Quiz Completed!</h3>
                      <p className="text-sm text-slate-400">
                        You scored <strong className="text-slate-200">{quizScore}</strong> out of <strong className="text-slate-200">{quizQuestions.length}</strong> questions correctly.
                      </p>
                    </div>

                    {/* XP Bonus Card */}
                    {xpEarned !== null && xpEarned > 0 && (
                      <div className="max-w-xs mx-auto p-4 bg-emerald-950/10 border border-emerald-500/20 rounded-2xl text-emerald-400 font-extrabold text-sm uppercase tracking-wider flex items-center justify-center gap-2">
                        <span>✨ Awarded +{xpEarned} XP!</span>
                      </div>
                    )}

                    <div className="flex justify-center gap-3">
                      <button
                        onClick={handleStartQuiz}
                        className="glass-button font-bold text-xs py-2 px-6 uppercase tracking-wider"
                      >
                        Try Again
                      </button>
                      <button
                        onClick={() => {
                          setQuizStarted(false);
                          setActiveTab('daily');
                        }}
                        className="py-2.5 px-6 rounded-xl border border-white/10 bg-white/2 font-bold text-xs text-slate-350 hover:text-slate-250 active:scale-95 transition-all uppercase tracking-wider"
                      >
                        Return Home
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
