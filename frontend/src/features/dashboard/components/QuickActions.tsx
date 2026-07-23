import { MessageSquare, BookOpen, CheckSquare, Plus, Lightbulb } from 'lucide-react';

interface QuickActionsProps {
  onMockActivity: (type: string, desc: string, xp: number) => void;
  isMocking: boolean;
}

export default function QuickActions({ onMockActivity, isMocking }: QuickActionsProps) {
  return (
    <div className="glass-panel p-6 rounded-2xl shadow-glass space-y-4">
      <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
        <Lightbulb className="h-5 w-5 text-amber-400" />
        Quick Actions
      </h3>

      <div className="flex flex-col gap-3">
        {/* Practice Speaking Button */}
        <button
          onClick={() => alert("Jarvis AI Coach voice channel starting soon!")}
          className="glass-button w-full flex items-center justify-center gap-3 py-3 font-semibold text-sm"
        >
          <MessageSquare className="h-5 w-5" />
          Practice Speaking (Jarvis AI)
        </button>

        {/* Core Actions Grid */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => alert("Vocabulary Review tool coming soon!")}
            className="p-3 rounded-xl border border-white/5 bg-white/2 hover:bg-white/5 active:scale-95 transition-all text-xs font-semibold text-slate-300 flex flex-col items-center gap-2"
          >
            <BookOpen className="h-5 w-5 text-primary-500" />
            Review Vocabulary
          </button>
          
          <button
            onClick={() => alert("Grammar Coach tool coming soon!")}
            className="p-3 rounded-xl border border-white/5 bg-white/2 hover:bg-white/5 active:scale-95 transition-all text-xs font-semibold text-slate-300 flex flex-col items-center gap-2"
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
