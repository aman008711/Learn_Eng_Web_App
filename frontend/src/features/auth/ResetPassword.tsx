import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react';
import api from '../../lib/axios';

const resetPasswordSchema = zod.object({
  password: zod.string().min(8, { message: "Password must be at least 8 characters" }),
  confirmPassword: zod.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type ResetPasswordSchemaType = zod.infer<typeof resetPasswordSchema>;

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordSchemaType>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordSchemaType) => {
    if (!token) {
      setServerError("Reset token is missing from the link URL.");
      return;
    }
    setIsSubmitting(true);
    setServerError(null);
    try {
      await api.post('/api/v1/auth/reset-password', {
        token: token,
        new_password: data.password,
      });

      setIsSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 2500);
    } catch (err: any) {
      setServerError(err.response?.data?.detail || "Failed to reset password. Link may be expired.");
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
        {isSuccess ? (
          <div className="text-center py-8 space-y-4">
            <CheckCircle2 className="h-16 w-16 text-emerald-500 mx-auto animate-bounce" />
            <h1 className="text-2xl font-bold text-slate-100">Password Updated!</h1>
            <p className="text-sm text-slate-400">
              Your credentials are secure. Redirecting you to login...
            </p>
          </div>
        ) : (
          <>
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold tracking-tight text-gradient mb-2">Reset Password</h1>
              <p className="text-sm text-slate-400">Establish a secure new password for your account.</p>
            </div>

            {!token && (
              <div className="mb-6 p-3 rounded-lg bg-yellow-950/40 border border-yellow-500/30 text-yellow-400 text-xs text-center">
                Warning: No recovery token detected. Ensure you followed the correct link.
              </div>
            )}

            {serverError && (
              <div className="mb-6 p-3 rounded-lg bg-red-950/40 border border-red-500/30 text-red-400 text-xs text-center">
                {serverError}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 h-5 w-5 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Min. 8 characters"
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

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 h-5 w-5 text-slate-500" />
                  <input
                    type="password"
                    placeholder="Repeat your password"
                    className="w-full pl-10 pr-4 glass-input text-sm"
                    {...register('confirmPassword')}
                  />
                </div>
                {errors.confirmPassword && (
                  <span className="text-red-400 text-xs mt-1 block">{errors.confirmPassword.message}</span>
                )}
              </div>

              <button type="submit" disabled={isSubmitting} className="w-full glass-button flex items-center justify-center gap-2">
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Password'
                )}
              </button>
            </form>

            <p className="mt-8 text-center text-xs text-slate-400">
              Remembered your credentials?{' '}
              <Link to="/login" className="text-primary-500 hover:text-primary-600 font-medium transition-colors">
                Back to Sign In
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
