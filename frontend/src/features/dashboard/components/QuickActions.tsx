import { MessageSquare, BookOpen, CheckSquare, Plus, Lightbulb, Mic } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface QuickActionsProps {
  onMockActivity: (type: string, desc: string, xp: number) => void;
  isMocking: boolean;
}

export default function QuickActions({ onMockActivity, isMocking }: QuickActionsProps) {
  const navigate = useNavigate();
  return (
    <div className="glass-panel p-6 rounded-2xl shadow-glass space-y-4">
      <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
        <Lightbulb className="h-5 w-5 text-amber-400" />
        Quick Actions
      </h3>

      <div className="flex flex-col gap-3">
        {/* Practice Speaking Button */}
        <button
          onClick={() => navigate('/speaking')}
          className="glass-button w-full flex items-center justify-center gap-3 py-3 font-semibold text-sm bg-gradient-to-r from-primary-600/20 via-sky-600/10 to-accent-purple/10 border-primary-500/20 hover:from-primary-600/35"
        >
          <Mic className="h-5 w-5 text-sky-400 animate-pulse" />
          Practice Speaking (Voice Coach)
        </button>

        {/* Core Actions Grid */}
        <div className="grid grid-cols-3 gap-2.5">
          <button
            onClick={() => navigate('/chat')}
            className="p-3.5 rounded-xl border border-white/5 bg-white/2 hover:bg-white/5 active:scale-95 transition-all text-xs font-semibold text-slate-350 flex flex-col items-center gap-2"
          >
            <MessageSquare className="h-5 w-5 text-sky-400" />
            AI Chat Coach
          </button>

          <button
            onClick={() => navigate('/vocab')}
            className="p-3.5 rounded-xl border border-white/5 bg-white/2 hover:bg-white/5 active:scale-95 transition-all text-xs font-semibold text-slate-350 flex flex-col items-center gap-2"
          >
            <BookOpen className="h-5 w-5 text-primary-500" />
            Vocabulary Review
          </button>
          
          <button
            onClick={() => navigate('/grammar')}
            className="p-3.5 rounded-xl border border-white/5 bg-white/2 hover:bg-white/5 active:scale-95 transition-all text-xs font-semibold text-slate-350 flex flex-col items-center gap-2"
          >
            <CheckSquare className="h-5 w-5 text-accent-purple" />
            Grammar Checker
          </button>
        </div>

        {/* Developer Sandbox Segment */}
        <div className="pt-4 border-t border-white/5 space-y-2">
          <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            Developer Sandbox
          </span>
          <button
            onClick={() => onMockActivity('speaking', 'Completed 5-minute English practice with Jarvis AI', 250)}
            disabled={isMocking}
            className="w-full py-2.5 rounded-xl border border-dashed border-primary-500/30 text-xs font-medium text-primary-400 hover:bg-primary-500/5 hover:border-primary-500/50 flex items-center justify-center gap-2 active:scale-98 transition-all disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            {isMocking ? 'Adding Practice...' : 'Simulate Speaking Activity (+250 XP)'}
          </button>
        </div>
      </div>
    </div>
  );
}
