import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { signIn } from '@/services/auth';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { refreshProfile } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const from = (location.state as any)?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const res = await signIn(email.trim(), password.trim());
      await refreshProfile();
      toast.success('Welcome back to Millennium Era!');

      if (from === '/' && res.user?.role && res.user.role !== 'customer') {
        navigate('/admin', { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    } catch (err: any) {
      console.error('Sign in error:', err);
      const rawMsg = err?.message || err?.error_description || '';
      const displayMsg =
        typeof rawMsg === 'string' && rawMsg.trim() !== '' && rawMsg !== '{}'
          ? rawMsg
          : 'Invalid email or password. Please verify your credentials or check your connection.';
      setErrorMsg(displayMsg);
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
            Sign In to Your Account
          </h1>
          <p className="text-xs text-gray-500">
            Access your orders, saved addresses, and member privileges.
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
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full text-xs border border-gray-300 rounded-md pl-9 pr-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-brand-red"
              />
              <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-semibold text-gray-700">Password</label>
              <Link to="/forgot-password" className="text-[11px] text-brand-red hover:underline">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full text-xs border border-gray-300 rounded-md pl-9 pr-10 py-2.5 focus:outline-none focus:ring-1 focus:ring-brand-red font-mono"
              />
              <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-red hover:bg-brand-red-dark text-white font-bold h-10 rounded-md shadow-sm text-xs mt-2 transition"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        <div className="pt-4 border-t border-gray-100 text-center text-xs text-gray-500">
          <span>Don't have an account? </span>
          <Link to="/register" className="font-bold text-brand-red hover:underline">
            Register now
          </Link>
        </div>
      </div>
    </div>
  );
};
