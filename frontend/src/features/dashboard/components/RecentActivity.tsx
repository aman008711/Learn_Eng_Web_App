import { MessageSquare, BookOpen, CheckSquare, Award, Clock, Star } from 'lucide-react';
import { UserActivity } from '../../../types/api';

interface RecentActivityProps {
  activities: UserActivity[];
}

export default function RecentActivity({ activities }: RecentActivityProps) {
  // Select icon based on activity type
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'speaking':
        return <MessageSquare className="h-4 w-4" />;
      case 'vocabulary':
        return <BookOpen className="h-4 w-4" />;
      case 'grammar':
        return <CheckSquare className="h-4 w-4" />;
      case 'milestone':
        return <Award className="h-4 w-4" />;
      default:
        return <Star className="h-4 w-4" />;
    }
  };

  // Select color indicators based on activity type
  const getActivityStyles = (type: string) => {
    switch (type) {
      case 'speaking':
        return 'bg-sky-500/10 border-sky-500/30 text-sky-400';
      case 'vocabulary':
        return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400';
      case 'grammar':
        return 'bg-violet-500/10 border-violet-500/30 text-violet-400';
      case 'milestone':
        return 'bg-amber-500/10 border-amber-500/30 text-amber-400';
      default:
        return 'bg-slate-500/10 border-slate-500/30 text-slate-400';
    }
  };

  // Convert date string into cleaner format
  const formatActivityDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="glass-panel p-6 rounded-2xl shadow-glass flex flex-col gap-5 h-full min-h-[350px]">
      <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
        <Clock className="h-5 w-5 text-primary-500" />
        Recent Activity
      </h3>

      {activities.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border border-dashed border-white/5 rounded-xl bg-white/1">
          <p className="text-sm text-slate-500">No recent activities logged.</p>
          <p className="text-xs text-slate-600 mt-1">Complete dashboard actions to see updates.</p>
        </div>
      ) : (
        <div className="relative pl-4 border-l border-white/5 space-y-6 flex-1">
          {activities.map((activity, idx) => (
            <div key={activity.id || idx} className="relative group">
              {/* Timeline Connector Dot/Icon */}
              <div
                className={`absolute -left-[27px] top-1 p-1.5 rounded-lg border flex items-center justify-center transition-transform group-hover:scale-110 ${getActivityStyles(
                  activity.activity_type
                )}`}
              >
                {getActivityIcon(activity.activity_type)}
              </div>

              {/* Activity Details Card */}
              <div className="space-y-1 pl-3">
                <div className="flex justify-between items-start gap-4">
                  <h4 className="text-sm font-semibold text-slate-200 leading-tight">
                    {activity.description}
                  </h4>
                  <span className="text-[10px] text-slate-500 font-medium whitespace-nowrap">
                    {formatActivityDate(activity.created_at)}
                  </span>
                </div>
                
                {activity.xp_gained > 0 && (
                  <span className="inline-flex items-center text-[10px] font-bold text-amber-500 gap-0.5">
                    +{activity.xp_gained} XP
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
