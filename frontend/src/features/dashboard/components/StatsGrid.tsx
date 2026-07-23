import { Flame, Star, Hourglass } from 'lucide-react';
import ProgressRing from './ProgressRing';

interface StatsGridProps {
  streak: number;
  xp: number;
  dailyGoalMinutes: number;
  dailyMinutesCompleted: number;
  progressPercentage: number;
}

export default function StatsGrid({
  streak,
  xp,
  dailyGoalMinutes,
  dailyMinutesCompleted,
  progressPercentage,
}: StatsGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Daily Streak Card */}
      <div className="glass-panel p-6 rounded-2xl flex items-center gap-5 shadow-glass hover:border-primary-500/20 transition-all duration-300">
        <div className="p-3.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-500">
          <Flame className="h-7 w-7" />
        </div>
        <div>
          <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Daily Streak
          </span>
          <span className="block text-3xl font-bold text-slate-100 mt-1">
            {streak} {streak === 1 ? 'day' : 'days'}
          </span>
          <span className="block text-xs text-orange-400 font-medium mt-1">
            {streak > 0 ? 'Keep the fire burning!' : 'Start your streak today!'}
          </span>
        </div>
      </div>

      {/* Experience Points Card */}
      <div className="glass-panel p-6 rounded-2xl flex items-center gap-5 shadow-glass hover:border-primary-500/20 transition-all duration-300">
        <div className="p-3.5 rounded-xl bg-primary-500/10 border border-primary-500/20 text-primary-500">
          <Star className="h-7 w-7" />
        </div>
        <div>
          <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Total XP Points
          </span>
          <span className="block text-3xl font-bold text-slate-100 mt-1">
            {xp.toLocaleString()} XP
          </span>
          <span className="block text-xs text-primary-400 font-medium mt-1">
            Earned from coaching practices
          </span>
        </div>
      </div>

      {/* Today's Goal Card */}
      <div className="glass-panel p-6 rounded-2xl flex items-center justify-between gap-4 shadow-glass hover:border-primary-500/20 transition-all duration-300 sm:col-span-2 lg:col-span-1">
        <div className="flex items-center gap-5">
          <div className="p-3.5 rounded-xl bg-accent-purple/10 border border-accent-purple/20 text-accent-purple">
            <Hourglass className="h-7 w-7" />
          </div>
          <div>
            <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Today's Goal
            </span>
            <span className="block text-2xl font-bold text-slate-100 mt-1">
              {dailyMinutesCompleted} / {dailyGoalMinutes} min
            </span>
            <span className="block text-xs text-accent-purple-400 font-medium mt-1">
              {progressPercentage >= 100 ? 'Goal achieved today!' : 'Practice speaking to hit target'}
            </span>
          </div>
        </div>

        {/* Progress Ring Widget */}
        <div className="relative flex items-center justify-center h-16 w-16">
          <ProgressRing radius={36} stroke={4} progress={progressPercentage} />
          <span className="absolute text-slate-200 text-xs font-bold">
            {Math.round(progressPercentage)}%
          </span>
        </div>
      </div>
    </div>
  );
}
