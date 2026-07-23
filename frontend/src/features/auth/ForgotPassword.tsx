import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import { Link } from 'react-router-dom';
import { Mail, Loader2, ArrowLeft, Send } from 'lucide-react';
import api from '../../lib/axios';

const forgotPasswordSchema = zod.object({
  email: zod.string().email({ message: "Invalid email address format" }),
});

type ForgotPasswordSchemaType = zod.infer<typeof forgotPasswordSchema>;

export default function ForgotPassword() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [devResetLink, setDevResetLink] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordSchemaType>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordSchemaType) => {
    setIsSubmitting(true);
    setServerError(null);
    setSuccessMessage(null);
    setDevResetLink(null);
    try {
      const response = await api.post('/api/v1/auth/forgot-password', {
        email: data.email,
      });

      setSuccessMessage(response.data.message || "If the email is registered, we have sent instructions.");
      
      // Hook up development reset links for user manual testing convenience
      if (response.data.dev_recovery_link) {
        setDevResetLink(response.data.dev_recovery_link);
      }
    } catch (err: any) {
      setServerError(err.response?.data?.detail || "Request failed. Please try again later.");
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
        <div className="mb-6">
          <Link to="/login" className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to Login
          </Link>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-gradient mb-2">Recover Password</h1>
          <p className="text-sm text-slate-400">Enter your email and we'll send you a recovery link.</p>
        </div>

        {serverError && (
          <div className="mb-6 p-3 rounded-lg bg-red-950/40 border border-red-500/30 text-red-400 text-xs text-center">
            {serverError}
          </div>
        )}

        {successMessage ? (
          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/20 text-slate-300 text-sm text-center">
              {successMessage}
            </div>

            {devResetLink && (
              <div className="p-4 rounded-xl bg-primary-950/30 border border-primary-500/30 text-slate-300 space-y-3">
                <span className="block text-xs font-bold text-primary-400 uppercase tracking-wider">
                  Developer Helper (Token Output):
                </span>
                <p className="text-xs text-slate-400 leading-relaxed">
                  In production, this link is delivered via email. Click below to proceed directly:
                </p>
                <a
                  href={devResetLink}
                  className="block text-center glass-button text-xs py-2 bg-gradient-to-r from-teal-500 to-primary-600 hover:from-teal-600 hover:to-primary-700"
                >
                  Go to Password Reset Screen
                </a>
              </div>
            )}
          </div>
        ) : (
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

            <button type="submit" disabled={isSubmitting} className="w-full glass-button flex items-center justify-center gap-2">
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Sending Link...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Send Reset Link
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
