import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { UtensilsCrossed, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { api, extractErrorMessage } from '../../api/client';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setResetToken(null);

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post<{ message: string; resetToken?: string }>(
        '/auth/forgot-password',
        { email: email.trim() }
      );
      setSuccessMessage(res.data.message);
      if (res.data.resetToken) {
        setResetToken(res.data.resetToken);
      }
    } catch (err) {
      setError(extractErrorMessage(err, 'Unable to process password reset request.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex items-center justify-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm">
            <UtensilsCrossed className="w-6 h-6" />
          </div>
          <div>
            <span className="font-display text-2xl font-bold tracking-tight text-[#0F172A]">
              BaryoBite
            </span>
            <p className="text-xs text-slate-500">Restaurant Business Analytics</p>
          </div>
        </div>

        <h1 className="mt-6 text-center font-display text-2xl font-bold text-[#0F172A]">
          Reset your password
        </h1>
        <p className="mt-1.5 text-center text-sm text-slate-600">
          Enter your account email address and we&apos;ll send you a reset link
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-2xl border border-slate-200/90 shadow-xs">
          {error && (
            <div
              role="alert"
              className="mb-5 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          {successMessage && (
            <div
              role="status"
              className="mb-5 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3.5 text-sm text-emerald-800 space-y-2"
            >
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <span>{successMessage}</span>
              </div>
              {resetToken && (
                <div className="pt-1">
                  <Link
                    to={`/reset-password?token=${encodeURIComponent(resetToken)}`}
                    className="inline-flex items-center font-semibold text-blue-600 hover:text-blue-700 underline"
                  >
                    Open Reset Password Page &rarr;
                  </Link>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div>
              <label htmlFor="forgot-email" className="block text-sm font-medium text-[#0F172A]">
                Email address
              </label>
              <div className="mt-1.5 relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="forgot-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@baryobite.com"
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-10 pr-4 py-2.5 text-sm text-[#0F172A] placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/15 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:opacity-60 transition-colors cursor-pointer"
            >
              {submitting ? 'Sending Reset Link...' : 'Send password reset link'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-[#0F172A] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Login</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
