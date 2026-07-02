import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Save, AlertCircle, CheckCircle, KeyRound } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import authService from '../services/authService';

const ProfilePage = () => {
  const { user, updateUserProfileState } = useAuth();
  const [form, setForm] = useState({ fullName: '', email: '' });
  const [passwordForm, setPasswordForm] = useState({ password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');

  useEffect(() => {
    if (user) {
      setForm({ fullName: user.fullName || '', email: user.email || '' });
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!form.fullName || !form.email) return setError('Name and email are required');
    setLoading(true);
    try {
      const updated = await authService.updateProfile({ fullName: form.fullName, email: form.email });
      updateUserProfileState(updated);
      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPwError(''); setPwSuccess('');
    if (!passwordForm.password || !passwordForm.confirmPassword) return setPwError('Please fill both password fields');
    if (passwordForm.password !== passwordForm.confirmPassword) return setPwError('Passwords do not match');
    if (passwordForm.password.length < 6) return setPwError('Password must be at least 6 characters');
    setPwLoading(true);
    try {
      await authService.updateProfile({ password: passwordForm.password });
      setPwSuccess('Password changed successfully!');
      setPasswordForm({ password: '', confirmPassword: '' });
      setTimeout(() => setPwSuccess(''), 3000);
    } catch (err) {
      setPwError(err.response?.data?.message || 'Failed to change password');
    } finally {
      setPwLoading(false);
    }
  };

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
    : 'N/A';

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 pt-24">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary dark:text-slate-100">My Profile</h1>
        <p className="text-sm text-text-muted dark:text-slate-400 mt-1">Manage your account information</p>
      </div>

      {/* Avatar Card */}
      <div className="card mb-6 flex items-center gap-5">
        <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center flex-shrink-0 shadow-md shadow-primary/20">
          <span className="text-white text-2xl font-bold">
            {user?.fullName?.charAt(0).toUpperCase()}
          </span>
        </div>
        <div>
          <h2 className="text-lg font-bold text-text-primary dark:text-slate-100">{user?.fullName}</h2>
          <p className="text-sm text-text-muted dark:text-slate-400">{user?.email}</p>
          <p className="text-xs text-text-light dark:text-slate-500 mt-0.5">Member since {memberSince}</p>
        </div>
      </div>

      {/* Profile Form */}
      <div className="card mb-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl bg-primary-light dark:bg-primary/20 flex items-center justify-center">
            <User className="w-4.5 h-4.5 text-primary" />
          </div>
          <h3 className="text-base font-bold text-text-primary dark:text-slate-100">Personal Information</h3>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2.5 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}
        {success && (
          <div className="mb-4 flex items-center gap-2.5 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
            <p className="text-sm text-green-600 dark:text-green-400">{success}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label-text">Full Name</label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted dark:text-slate-400" />
              <input
                id="profile-name"
                type="text"
                value={form.fullName}
                onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))}
                className="input-field pl-10"
              />
            </div>
          </div>
          <div>
            <label className="label-text">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted dark:text-slate-400" />
              <input
                id="profile-email"
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="input-field pl-10"
              />
            </div>
          </div>
          <button type="submit" disabled={loading} id="profile-save" className="btn-primary py-2.5 text-sm flex items-center gap-2 disabled:opacity-60 disabled:scale-100">
            {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>

      {/* Password Change */}
      <div className="card">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center">
            <KeyRound className="w-4.5 h-4.5 text-purple-500" />
          </div>
          <h3 className="text-base font-bold text-text-primary dark:text-slate-100">Change Password</h3>
        </div>

        {pwError && (
          <div className="mb-4 flex items-center gap-2.5 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-600 dark:text-red-400">{pwError}</p>
          </div>
        )}
        {pwSuccess && (
          <div className="mb-4 flex items-center gap-2.5 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
            <p className="text-sm text-green-600 dark:text-green-400">{pwSuccess}</p>
          </div>
        )}

        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div>
            <label className="label-text">New Password</label>
            <input
              id="new-password"
              type="password"
              value={passwordForm.password}
              onChange={e => setPasswordForm(f => ({ ...f, password: e.target.value }))}
              placeholder="Min. 6 characters"
              className="input-field"
            />
          </div>
          <div>
            <label className="label-text">Confirm New Password</label>
            <input
              id="confirm-new-password"
              type="password"
              value={passwordForm.confirmPassword}
              onChange={e => setPasswordForm(f => ({ ...f, confirmPassword: e.target.value }))}
              placeholder="Re-enter new password"
              className="input-field"
            />
          </div>
          <button type="submit" disabled={pwLoading} id="password-save" className="btn-outline py-2.5 text-sm flex items-center gap-2 disabled:opacity-60 disabled:scale-100">
            {pwLoading ? <span className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /> : <KeyRound className="w-4 h-4" />}
            {pwLoading ? 'Changing...' : 'Change Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;
