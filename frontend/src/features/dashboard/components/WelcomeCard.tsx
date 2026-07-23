import { Award, Zap } from 'lucide-react';

interface WelcomeCardProps {
  email: string;
  level: number;
  xp: number;
}

export default function WelcomeCard({ email, level, xp }: WelcomeCardProps) {
  // Extract username from email
  const username = email.split('@')[0];
  const capitalizedUser = username.charAt(0).toUpperCase() + username.slice(1);

  // Gamification level range: e.g., level boundaries at increments of 1000 XP
  const currentLevelMinXp = (level - 1) * 1000;
  const xpInCurrentLevel = xp - currentLevelMinXp;
  const levelProgressPercentage = Math.min(100, Math.max(0, (xpInCurrentLevel / 1000) * 100));

  return (
    <div className="glass-panel p-6 md:p-8 rounded-2xl relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-glass">
      {/* Glow highlight */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-primary-500/10 rounded-full filter blur-[60px]"></div>

      <div className="space-y-2 z-10">
        <h2 className="text-2xl md:text-3xl font-bold text-slate-100">
          Hello, <span className="text-gradient">{capitalizedUser}</span>!
        </h2>
        <p className="text-slate-400 text-sm md:text-base max-w-md">
          Ready to level up your English? Practice speaking, writing, and get constructive grammar feedback instantly from Jarvis.
        </p>
      </div>

      <div className="w-full md:w-72 glass-panel p-4 rounded-xl border-white/5 z-10 flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-accent-purple" />
            <span className="text-sm font-semibold text-slate-200">Level {level}</span>
          </div>
          <div className="flex items-center gap-1">
            <Zap className="h-4 w-4 text-amber-500" />
            <span className="text-xs text-slate-400">{xp} total XP</span>
          </div>
        </div>

        {/* XP Progress Bar */}
        <div className="space-y-1">
          <div className="w-full bg-slate-900/60 rounded-full h-2 overflow-hidden border border-white/5">
            <div
              className="bg-gradient-to-r from-primary-500 to-accent-purple h-full rounded-full transition-all duration-1000"
              style={{ width: `${levelProgressPercentage}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-[10px] text-slate-500 font-medium">
            <span>{xpInCurrentLevel} / 1000 XP</span>
            <span>Level {level + 1}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
