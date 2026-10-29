import React, { useState } from 'react';
import { User, Phone, Mail, MapPin, Shield, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { updateProfile } from '@/services/auth';
import { toast } from 'sonner';

export const AccountPage: React.FC = () => {
  const { user, profile, refreshProfile } = useAuth();

  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateProfile({
        full_name: fullName.trim(),
        phone: phone.trim(),
      });
      await refreshProfile();
      toast.success('Profile updated successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-gray-50/60 min-h-screen py-10">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight mb-8">
          My Account & Profile
        </h1>

        <div className="bg-white border border-gray-200 rounded-xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-4 pb-6 border-b border-gray-100">
            <div className="w-16 h-16 rounded-full bg-brand-charcoal text-brand-gold font-black text-xl flex items-center justify-center">
              {profile?.full_name?.charAt(0) || user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                {profile?.full_name || 'Customer'}
              </h2>
              <p className="text-xs text-gray-500">{user?.email}</p>
              <div className="mt-1 inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-700">
                <span>Role: {profile?.role || 'Customer'}</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleUpdate} className="space-y-4 max-w-lg">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full text-xs border border-gray-300 rounded-md p-2.5 focus:outline-none focus:ring-1 focus:ring-brand-red"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full text-xs border border-gray-200 bg-gray-50 rounded-md p-2.5 text-gray-500 cursor-not-allowed"
              />
              <p className="text-[10px] text-gray-400 mt-1">Email cannot be changed directly.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+880 1XXXXXXXXX"
                className="w-full text-xs border border-gray-300 rounded-md p-2.5 focus:outline-none focus:ring-1 focus:ring-brand-red font-mono"
              />
            </div>

            <Button
              type="submit"
              disabled={isSaving}
              className="bg-brand-red hover:bg-brand-red-dark text-white font-bold text-xs h-10 px-6 rounded-md shadow-sm transition"
            >
              {isSaving ? 'Saving Changes...' : 'Save Profile Changes'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};
