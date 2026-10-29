import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { signUp } from '@/services/auth';
import { toast } from 'sonner';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);

    try {
      await signUp(email.trim(), password, fullName.trim());
      toast.success('Registration successful! Please sign in.');
      navigate('/login');
    } catch (err: any) {
      console.error('Registration error:', err);
      setErrorMsg(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 bg-gray-50/60">
      <div className="max-w-md w-full bg-white border border-gray-200 rounded-2xl p-8 shadow-sm space-y-6">
        <div className="text-center space-y-2">
          <Link to="/" className="inline-block">
            <img src="/assets/logo.png" alt="Millennium Era" className="h-12 mx-auto object-contain" />
          </Link>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
            Create an Account
          </h1>
          <p className="text-xs text-gray-500">
            Join Millennium Era and unlock exclusive shopping privileges.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Full Name
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Rahat Islam"
                className="w-full text-xs border border-gray-300 rounded-md pl-9 pr-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-brand-red"
              />
              <User className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full text-xs border border-gray-300 rounded-md pl-9 pr-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-brand-red"
              />
              <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Password (minimum 6 characters)
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full text-xs border border-gray-300 rounded-md pl-9 pr-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-brand-red"
              />
              <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Confirm Password
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full text-xs border border-gray-300 rounded-md pl-9 pr-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-brand-red"
              />
              <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-red hover:bg-brand-red-dark text-white font-bold h-10 rounded-md shadow-sm text-xs mt-2 transition"
          >
            {loading ? 'Creating Account...' : 'Register Account'}
          </Button>
        </form>

        <div className="pt-4 border-t border-gray-100 text-center text-xs text-gray-500">
          <span>Already have an account? </span>
          <Link to="/login" className="font-bold text-brand-red hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};
