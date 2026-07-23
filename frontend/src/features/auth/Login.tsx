import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import api from '../../lib/axios';
import { useAuthStore } from '../../store/authStore';

const loginSchema = zod.object({
  email: zod.string().email({ message: "Invalid email address format" }),
  password: zod.string().min(8, { message: "Password must be at least 8 characters" }),
});

type LoginSchemaType = zod.infer<typeof loginSchema>;

export default function Login() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginSchemaType>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginSchemaType) => {
    setIsSubmitting(true);
    setServerError(null);
    try {
      // Build form-urlencoded request for FastAPI dependency compatibility
      const params = new URLSearchParams();
      params.append('username', data.email);
      params.append('password', data.password);

      const response = await api.post('/api/v1/auth/login', params, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      const { access_token, refresh_token } = response.data;
      
      // Fetch current user details to update store
      const userResponse = await api.get('/api/v1/auth/test-token', {
        headers: { Authorization: `Bearer ${access_token}` }
      });

      setAuth(userResponse.data, access_token, refresh_token);
      navigate('/');
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || "Connection error. Please try again.";
      setServerError(typeof errorMsg === 'string' ? errorMsg : "Invalid credentials");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#070c14] relative px-4 py-12">
      {/* Decorative Blur Spheres */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-primary-500/10 rounded-full filter blur-[100px] animate-pulse-slow"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent-purple/10 rounded-full filter blur-[120px] animate-pulse-slow"></div>

      <div className="w-full max-w-md glass-panel p-8 rounded-2xl shadow-glass relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold tracking-tight text-gradient mb-2">Jarvis AI</h1>
          <p className="text-sm text-slate-400">Welcome back. Let's practice English.</p>
        </div>

        {serverError && (
          <div className="mb-6 p-3 rounded-lg bg-red-950/40 border border-red-500/30 text-red-400 text-xs text-center">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 h-5 w-5 text-slate-500" />
              <input
                type="email"
                placeholder="you@example.com"
                className="w-full pl-10 pr-4 glass-input text-sm"
                {...register('email')}
              />
            </div>
            {errors.email && (
              <span className="text-red-400 text-xs mt-1 block">{errors.email.message}</span>
            )}
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Password
              </label>
              <Link
                to="/forgot-password"
                className="text-xs text-primary-500 hover:text-primary-600 transition-colors"
              >
                Forgot Password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 h-5 w-5 text-slate-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 glass-input text-sm"
                {...register('password')}
              />
              <button
                type="button"
                className="absolute right-3 top-3.5 text-slate-500 hover:text-white"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {errors.password && (
              <span className="text-red-400 text-xs mt-1 block">{errors.password.message}</span>
            )}
          </div>

          <button type="submit" disabled={isSubmitting} className="w-full glass-button flex items-center justify-center gap-2">
            {isSubmitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Signing In...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <p className="mt-8 text-center text-xs text-slate-400">
          New to Jarvis?{' '}
          <Link to="/signup" className="text-primary-500 hover:text-primary-600 font-medium transition-colors">
            Create an Account
          </Link>
        </p>
      </div>
    </div>
  );
}
