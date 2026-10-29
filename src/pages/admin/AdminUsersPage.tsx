import React, { useEffect, useState } from 'react';
import { Users, Search, Shield, Ban, CheckCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { getAdminUsers, updateUserAccountStatus } from '@/services/admin';
import { formatDate } from '@/lib/utils';
import type { Profile } from '@/types';
import { toast } from 'sonner';

export const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [suspendingUser, setSuspendingUser] = useState<Profile | null>(null);
  const [suspendReason, setSuspendReason] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await getAdminUsers({
        search: search.trim() || undefined,
        status: statusFilter === 'all' ? undefined : statusFilter,
      });
      setUsers(res.data);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers();
  };

  const handleConfirmSuspend = async () => {
    if (!suspendingUser) return;
    try {
      await updateUserAccountStatus(
        suspendingUser.id,
        'suspended',
        suspendReason || 'Suspicious activity or violation of store terms'
      );
      toast.info(`Account for ${suspendingUser.full_name || suspendingUser.email} suspended`);
      setSuspendingUser(null);
      setSuspendReason('');
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message || 'Suspension failed');
    }
  };

  const handleRestore = async (u: Profile) => {
    try {
      await updateUserAccountStatus(u.id, 'active');
      toast.success(`Account for ${u.full_name || u.email} restored to active!`);
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message || 'Restore failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">
            User Management
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            View customer profiles, examine order histories, and manage security restrictions.
          </p>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Search by name, email, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs bg-gray-50 border border-gray-300 rounded-md pl-9 pr-4 py-2 focus:outline-none focus:ring-1 focus:ring-brand-red"
          />
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
        </form>

        <div className="flex items-center gap-2">
          {['all', 'active', 'suspended'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold capitalize transition ${
                statusFilter === st
                  ? 'bg-brand-red text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-gray-50 text-gray-500 font-bold border-b border-gray-200 uppercase text-[10px]">
              <tr>
                <th className="p-3.5">User</th>
                <th className="p-3.5">Email</th>
                <th className="p-3.5">Phone</th>
                <th className="p-3.5">Role</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Joined Date</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-400">
                    Loading users...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-400">
                    No users found matching query.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50/70 transition">
                    <td className="p-3.5 font-bold text-gray-900">
                      {u.full_name || 'Customer'}
                    </td>
                    <td className="p-3.5 text-gray-600 font-mono">{u.email || '—'}</td>
                    <td className="p-3.5 text-gray-600 font-mono">{u.phone || '—'}</td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-700">
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          u.account_status === 'active'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {u.account_status}
                      </span>
                    </td>
                    <td className="p-3.5 text-gray-500 text-[11px] whitespace-nowrap">
                      {formatDate(u.created_at)}
                    </td>
                    <td className="p-3.5 text-right">
                      {u.account_status === 'active' ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSuspendingUser(u)}
                          className="border-red-200 text-red-600 hover:bg-red-50 text-[10px] h-7 px-2.5"
                        >
                          <Ban className="w-3.5 h-3.5 mr-1" />
                          Suspend
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRestore(u)}
                          className="border-green-200 text-green-700 hover:bg-green-50 text-[10px] h-7 px-2.5 font-bold"
                        >
                          <CheckCircle className="w-3.5 h-3.5 mr-1" />
                          Restore
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Suspend Confirmation Dialog */}
      {suspendingUser && (
        <Dialog open={!!suspendingUser} onOpenChange={() => setSuspendingUser(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-gray-900">
                Suspend Account: {suspendingUser.full_name || suspendingUser.email}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-3 py-2 text-xs">
              <p className="text-gray-500">
                This will prevent the user from placing new orders while preserving all
                historical financial and order ledger records.
              </p>
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Reason for Suspension:
                </label>
                <textarea
                  rows={3}
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                  placeholder="e.g. Multiple unpaid fake order attempts"
                  className="w-full border border-gray-300 rounded-md p-2 text-xs focus:outline-none focus:ring-1 focus:ring-brand-red"
                />
              </div>
            </div>

            <DialogFooter className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setSuspendingUser(null)}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleConfirmSuspend}
                className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold"
              >
                Confirm Suspension
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
