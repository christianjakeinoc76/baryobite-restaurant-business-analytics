import React, { useEffect, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { api, extractErrorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import type { RestaurantSettings } from '../types';

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();

  const [settings, setSettings] = useState<RestaurantSettings>({
    restaurantName: 'BaryoBite Kitchen & Grill',
    tagline: '',
    address: '',
    phone: '',
    email: '',
    taxRate: 12,
    currency: '₱',
  });
  const [settingsSaved, setSettingsSaved] = useState('');
  const [settingsError, setSettingsError] = useState('');

  const [fullName, setFullName] = useState(user?.name || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [profileSaved, setProfileSaved] = useState('');
  const [profileError, setProfileError] = useState('');

  useEffect(() => {
    api
      .get<{ data: RestaurantSettings }>('/settings')
      .then((res) => setSettings(res.data.data))
      .catch(() => {});
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsSaved('');
    setSettingsError('');
    try {
      await api.put('/settings', settings);
      setSettingsSaved('Restaurant settings saved successfully.');
    } catch (err) {
      setSettingsError(extractErrorMessage(err, 'Failed to save settings.'));
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaved('');
    setProfileError('');
    try {
      await api.put('/auth/profile', {
        name: fullName,
        currentPassword: currentPassword || undefined,
        newPassword: newPassword || undefined,
      });
      setCurrentPassword('');
      setNewPassword('');
      await refreshUser();
      setProfileSaved('Account profile updated.');
    } catch (err) {
      setProfileError(extractErrorMessage(err, 'Failed to update profile.'));
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="font-display text-2xl font-bold text-[#0F172A]">Settings</h1>
        <p className="mt-1 text-sm text-slate-600">
          Configure restaurant profile, tax &amp; currency preferences, and your account security
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Restaurant Profile */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6">
          <h2 className="font-display text-lg font-bold text-[#0F172A]">
            Restaurant Profile
          </h2>
          <p className="text-xs text-slate-500 mb-4">
            Displayed on receipts, reports, and dashboard headers
          </p>

          {settingsSaved && (
            <div className="mb-4 rounded-xl bg-emerald-50 border border-emerald-200 px-3.5 py-2.5 text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{settingsSaved}</span>
            </div>
          )}
          {settingsError && (
            <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-3.5 py-2.5 text-xs text-red-700">
              {settingsError}
            </div>
          )}

          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div>
              <label htmlFor="set-name" className="block text-xs font-semibold text-slate-700">
                Restaurant Name
              </label>
              <input
                id="set-name"
                type="text"
                value={settings.restaurantName}
                onChange={(e) =>
                  setSettings((s) => ({ ...s, restaurantName: e.target.value }))
                }
                className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-[#0F172A]"
              />
            </div>

            <div>
              <label htmlFor="set-address" className="block text-xs font-semibold text-slate-700">
                Address
              </label>
              <input
                id="set-address"
                type="text"
                value={settings.address}
                onChange={(e) => setSettings((s) => ({ ...s, address: e.target.value }))}
                className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-[#0F172A]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="set-phone" className="block text-xs font-semibold text-slate-700">
                  Phone
                </label>
                <input
                  id="set-phone"
                  type="text"
                  value={settings.phone}
                  onChange={(e) => setSettings((s) => ({ ...s, phone: e.target.value }))}
                  className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-[#0F172A]"
                />
              </div>
              <div>
                <label htmlFor="set-tax" className="block text-xs font-semibold text-slate-700">
                  VAT / Tax Rate (%)
                </label>
                <input
                  id="set-tax"
                  type="number"
                  min={0}
                  max={50}
                  value={settings.taxRate}
                  onChange={(e) =>
                    setSettings((s) => ({ ...s, taxRate: Number(e.target.value) }))
                  }
                  className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-[#0F172A]"
                />
              </div>
            </div>

            <button
              type="submit"
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 cursor-pointer"
            >
              Save Restaurant Settings
            </button>
          </form>
        </div>

        {/* User Account & Security */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6">
          <h2 className="font-display text-lg font-bold text-[#0F172A]">
            Account &amp; Security
          </h2>
          <p className="text-xs text-slate-500 mb-4">
            Update your display name or change your password
          </p>

          {profileSaved && (
            <div className="mb-4 rounded-xl bg-emerald-50 border border-emerald-200 px-3.5 py-2.5 text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{profileSaved}</span>
            </div>
          )}
          {profileError && (
            <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-3.5 py-2.5 text-xs text-red-700">
              {profileError}
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label htmlFor="acc-name" className="block text-xs font-semibold text-slate-700">
                Full Name
              </label>
              <input
                id="acc-name"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-[#0F172A]"
              />
            </div>

            <div>
              <label htmlFor="acc-email" className="block text-xs font-semibold text-slate-700">
                Email Address
              </label>
              <input
                id="acc-email"
                type="email"
                disabled
                value={user?.email || ''}
                className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-slate-100 px-3.5 py-2 text-sm text-slate-500"
              />
            </div>

            <div>
              <label htmlFor="acc-curr-pw" className="block text-xs font-semibold text-slate-700">
                Current Password (optional)
              </label>
              <input
                id="acc-curr-pw"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password to change"
                className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-[#0F172A]"
              />
            </div>

            <div>
              <label htmlFor="acc-new-pw" className="block text-xs font-semibold text-slate-700">
                New Password (optional)
              </label>
              <input
                id="acc-new-pw"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-[#0F172A]"
              />
            </div>

            <button
              type="submit"
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 cursor-pointer"
            >
              Update Account
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
