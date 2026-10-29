import React, { useEffect, useState } from 'react';
import { FileText, Shield, User, Clock } from 'lucide-react';
import { getAuditLogs } from '@/services/admin';
import { formatDateTime } from '@/lib/utils';
import type { AuditLog } from '@/types';

export const AdminAuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAuditLogs()
      .then(setLogs)
      .catch((err) => console.warn('Could not load audit logs:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">
            Security & Audit Logs
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Immutable tracking record of all staff operations, status overrides, and role actions.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-gray-50 text-gray-500 font-bold border-b border-gray-200 uppercase text-[10px]">
              <tr>
                <th className="p-3.5">Timestamp</th>
                <th className="p-3.5">Staff User</th>
                <th className="p-3.5">Action</th>
                <th className="p-3.5">Entity</th>
                <th className="p-3.5">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-400">
                    Loading audit trail...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-400">
                    No administrative audit events recorded yet.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/70 transition">
                    <td className="p-3.5 text-gray-500 whitespace-nowrap">
                      {formatDateTime(log.created_at)}
                    </td>
                    <td className="p-3.5 font-bold text-gray-900">
                      {log.user?.full_name || log.user?.email || 'System'}
                    </td>
                    <td className="p-3.5 font-mono text-brand-red font-semibold">
                      {log.action}
                    </td>
                    <td className="p-3.5 font-medium text-gray-700 capitalize">
                      {log.entity_type} {log.entity_id ? `(#${log.entity_id.slice(0, 8)})` : ''}
                    </td>
                    <td className="p-3.5 font-mono text-gray-400">
                      {log.ip_address || '127.0.0.1'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
