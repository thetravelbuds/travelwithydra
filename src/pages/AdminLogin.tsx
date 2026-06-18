import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../lib/api/auth';
import userProfileService from '../lib/api/userProfile';

const AdminLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const { user, session, error: signInError } = await authService.signIn(email, password);

      if (signInError || !user || !session) {
        setError(signInError?.message || 'Invalid admin credentials.');
        return;
      }

      const { profile } = await userProfileService.getCurrentUserProfile();
      const isAdmin =
        profile?.subscription_tier === 'admin' ||
        user.user_metadata?.subscription_tier === 'admin' ||
        user.user_metadata?.role === 'admin';

      if (!isAdmin) {
        await authService.signOut();
        setError('This account does not have admin access.');
        return;
      }

      navigate('/admin');
    } catch (submitError) {
      console.error(submitError);
      setError('Unable to sign in. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg">
        <h1 className="text-2xl font-bold text-gray-900">travelwithydra Admin</h1>
        <p className="mt-2 text-sm text-gray-600">
          Sign in with your administrator account to manage applications and view statistics.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="admin-email" className="mb-1 block text-sm font-medium text-gray-700">
              Admin email
            </label>
            <input
              id="admin-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
              required
            />
          </div>
          <div>
            <label htmlFor="admin-password" className="mb-1 block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="admin-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
              required
            />
          </div>

          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-lg bg-teal-700 px-4 py-2.5 font-semibold text-white hover:bg-teal-800 disabled:opacity-50"
          >
            {isLoading ? 'Signing in...' : 'Sign in as Admin'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          <Link to="/" className="text-teal-700 hover:text-teal-800">
            Back to website
          </Link>
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;
