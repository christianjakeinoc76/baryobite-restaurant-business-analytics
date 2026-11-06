import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, UtensilsCrossed, User as UserIcon, Mail, Lock, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { extractErrorMessage } from '../../api/client';

export default function SignUpPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Full name is required.');
      return;
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (password !== passwordConfirmation) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      await register(name.trim(), email.trim(), password, passwordConfirmation);
      navigate('/', { replace: true });
    } catch (err) {
      setError(extractErrorMessage(err, 'Could not create account.'));
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
          Create your account
        </h1>
        <p className="mt-1.5 text-center text-sm text-slate-600">
          Start managing orders, inventory, and business analytics
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

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label htmlFor="signup-name" className="block text-sm font-medium text-[#0F172A]">
                Full name
              </label>
              <div className="mt-1.5 relative">
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="signup-name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Juan Dela Cruz"
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-10 pr-4 py-2.5 text-sm text-[#0F172A] placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/15 transition-colors"
                />
              </div>
            </div>

            <div>
              <label htmlFor="signup-email" className="block text-sm font-medium text-[#0F172A]">
                Email address
              </label>
              <div className="mt-1.5 relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="signup-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@baryobite.com"
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-10 pr-4 py-2.5 text-sm text-[#0F172A] placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/15 transition-colors"
                />
              </div>
            </div>

            <div>
              <label htmlFor="signup-password" className="block text-sm font-medium text-[#0F172A]">
                Password
              </label>
              <div className="mt-1.5 relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="signup-password"
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
                htmlFor="signup-confirm-password"
                className="block text-sm font-medium text-[#0F172A]"
              >
                Confirm password
              </label>
              <div className="mt-1.5 relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="signup-confirm-password"
                  name="passwordConfirmation"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={passwordConfirmation}
                  onChange={(e) => setPasswordConfirmation(e.target.value)}
                  placeholder="Re-enter your password"
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-10 pr-4 py-2.5 text-sm text-[#0F172A] placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/15 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="mt-2 w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:opacity-60 transition-colors cursor-pointer"
            >
              <span>{submitting ? 'Creating Account...' : 'Create Account'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600">
            Already have an account?{' '}
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
