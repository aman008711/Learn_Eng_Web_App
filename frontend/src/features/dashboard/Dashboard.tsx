import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { LogOut, BookOpen } from 'lucide-react';

import api from '../../lib/axios';
import { useAuthStore } from '../../store/authStore';
import { DashboardData } from '../../types/api';
import WelcomeCard from './components/WelcomeCard';
import StatsGrid from './components/StatsGrid';
import QuickActions from './components/QuickActions';
import RecentActivity from './components/RecentActivity';

// Skeleton UI shown during server query execution
const DashboardSkeleton = () => (
  <div className="min-h-screen bg-[#070c14] text-slate-100 p-4 md:p-8 space-y-8 animate-pulse">
    <div className="flex justify-between items-center max-w-7xl mx-auto border-b border-white/5 pb-4">
      <div className="h-8 w-48 bg-slate-800 rounded-lg"></div>
      <div className="h-10 w-24 bg-slate-800 rounded-lg"></div>
    </div>
    
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="h-40 w-full bg-slate-800/50 rounded-2xl border border-white/5"></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="h-28 bg-slate-800/50 rounded-2xl border border-white/5"></div>
        <div className="h-28 bg-slate-800/50 rounded-2xl border border-white/5"></div>
        <div className="h-28 bg-slate-800/50 rounded-2xl border border-white/5"></div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 h-96 bg-slate-800/50 rounded-2xl border border-white/5"></div>
        <div className="h-96 bg-slate-800/50 rounded-2xl border border-white/5"></div>
      </div>
    </div>
  </div>
);

export default function Dashboard() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { clearAuth } = useAuthStore();

  // 1. Fetch dashboard stats
  const { data, isLoading, error } = useQuery<DashboardData>({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const response = await api.get('/api/v1/dashboard');
      return response.data;
    },
  });

  // 2. Mock activity mutation for developer testing
  const mockActivityMutation = useMutation({
    mutationFn: async (payload: { type: string; desc: string; xp: number }) => {
      const response = await api.post('/api/v1/dashboard/mock-activity', null, {
        params: {
          activity_type: payload.type,
          description: payload.desc,
          xp_gained: payload.xp,
        },
      });
      return response.data;
    },
    onSuccess: () => {
      // Invalidate query to pull fresh dashboard details
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  const handleMockActivityTrigger = (type: string, desc: string, xp: number) => {
    mockActivityMutation.mutate({ type, desc, xp });
  };

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#070c14] flex flex-col items-center justify-center text-slate-100 p-4">
        <div className="glass-panel p-8 rounded-2xl max-w-md text-center border-red-500/20">
          <h2 className="text-xl font-bold text-red-400 mb-2">Failed to Load Dashboard</h2>
          <p className="text-slate-400 text-sm mb-6">
            There was a problem syncing your statistics. Please log in again.
          </p>
          <button onClick={handleLogout} className="glass-button w-full">
            Log In Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070c14] text-slate-100 relative">
      {/* Decorative radial gradients background */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-12 left-1/4 w-96 h-96 bg-primary-500/5 rounded-full filter blur-[120px]"></div>
        <div className="absolute bottom-24 right-1/4 w-[500px] h-[500px] bg-accent-purple/5 rounded-full filter blur-[150px]"></div>
      </div>

      {/* Main Header */}
      <header className="border-b border-white/5 sticky top-0 bg-[#070c14]/80 backdrop-blur-md z-30">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-primary-500 to-accent-purple text-white shadow-glass">
              <BookOpen className="h-5 w-5" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-gradient">
              Jarvis AI Coach
            </h1>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 border border-white/5 bg-white/2 hover:bg-white/5 hover:text-red-400 rounded-xl transition-all duration-200 text-xs font-semibold text-slate-300"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Workspace Dashboard Content */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-8 relative z-10">
        
        {/* Welcome Section */}
        <WelcomeCard
          email={data.user_email}
          level={data.level}
          xp={data.xp}
        />

        {/* Stats Summary Grid Section */}
        <StatsGrid
          streak={data.streak}
          xp={data.xp}
          dailyGoalMinutes={data.daily_goal_minutes}
          dailyMinutesCompleted={data.daily_minutes_completed}
          progressPercentage={data.progress_percentage}
        />

        {/* Interactive Workspace Grid Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Chronological Recent Activity (Left side) */}
          <div className="lg:col-span-2">
            <RecentActivity activities={data.recent_activities} />
          </div>

          {/* Action Links & Simulation Console (Right side) */}
          <div>
            <QuickActions
              onMockActivity={handleMockActivityTrigger}
              isMocking={mockActivityMutation.isPending}
            />
          </div>

        </div>

      </main>
    </div>
  );
}
