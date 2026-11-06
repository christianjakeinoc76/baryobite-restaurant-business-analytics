import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { UtensilsCrossed, Lock, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { api, extractErrorMessage } from '../../api/client';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!token) {
      setError('Reset token is missing. Please request a new password reset link.');
      return;
    }
    if (password.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }
    if (password !== passwordConfirmation) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post<{ message: string }>('/auth/reset-password', {
        token,
        password,
        passwordConfirmation,
      });
      setSuccess(res.data.message);
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 1500);
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to reset password.'));
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
          Set a new password
        </h1>
        <p className="mt-1.5 text-center text-sm text-slate-600">
          Choose a strong password for your BaryoBite account
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

          {success && (
            <div
              role="status"
              className="mb-5 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-800 flex items-center gap-2.5"
            >
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div>
              <label htmlFor="reset-password" className="block text-sm font-medium text-[#0F172A]">
                New password
              </label>
              <div className="mt-1.5 relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="reset-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-10 pr-11 py-2.5 text-sm text-[#0F172A] placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/15 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label
                htmlFor="reset-confirm-password"
                className="block text-sm font-medium text-[#0F172A]"
              >
                Confirm new password
              </label>
              <div className="mt-1.5 relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="reset-confirm-password"
                  name="passwordConfirmation"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={passwordConfirmation}
                  onChange={(e) => setPasswordConfirmation(e.target.value)}
                  placeholder="Re-enter new password"
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-10 pr-4 py-2.5 text-sm text-[#0F172A] placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/15 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:opacity-60 transition-colors cursor-pointer"
            >
              {submitting ? 'Updating Password...' : 'Update password'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600">
            Remembered your password?{' '}
            <Link
              to="/login"
              className="font-semibold text-blue-600 hover:text-blue-700 transition-colors"
            >
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
