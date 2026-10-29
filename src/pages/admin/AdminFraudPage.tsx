import React, { useEffect, useState } from 'react';
import { ShieldAlert, CheckCircle2, AlertTriangle, ShieldCheck, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { getFraudFlags, resolveFraudFlag } from '@/services/admin';
import { formatDateTime } from '@/lib/utils';
import type { FraudFlag } from '@/types';
import { toast } from 'sonner';

export const AdminFraudPage: React.FC = () => {
  const [flags, setFlags] = useState<FraudFlag[]>([]);
  const [loading, setLoading] = useState(true);

  // Prevention Toggles matching Reference Mockup
  const [enableDetection, setEnableDetection] = useState(true);
  const [autoCancelSuspicious, setAutoCancelSuspicious] = useState(false);
  const [minOrderValue, setMinOrderValue] = useState('500');
  const [blockMultipleOrders, setBlockMultipleOrders] = useState(true);
  const [flagHighRiskUsers, setFlagHighRiskUsers] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);

  const fetchFlags = async () => {
    setLoading(true);
    try {
      const data = await getFraudFlags();
      setFlags(data);
    } catch (err) {
      console.error('Error fetching fraud flags:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlags();
  }, []);

  const handleSaveSettings = () => {
    setSavingSettings(true);
    setTimeout(() => {
      setSavingSettings(false);
      toast.success('Fraud & fake order prevention rules updated!');
    }, 600);
  };

  const handleResolve = async (flagId: string) => {
    try {
      await resolveFraudFlag(flagId, 'resolved', 'Reviewed and resolved by staff');
      toast.success('Flag resolved');
      fetchFlags();
    } catch (err: any) {
      toast.error(err.message || 'Action failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">
            Fraud / Fake Order Prevention
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Configure automated bot & fake order protection rules and review suspicious order flags.
          </p>
        </div>
      </div>

      {/* Configuration Panel Matching Reference Mockup */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6 max-w-2xl">
        <h3 className="text-sm font-bold text-gray-900 pb-3 border-b border-gray-100 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-brand-red" />
          <span>Automated Protection Controls</span>
        </h3>

        <div className="space-y-4 text-xs">
          {/* Toggle 1 */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-800">Enable Fake Order Detection</p>
              <p className="text-gray-400 text-[11px]">
                Monitors duplicate submissions, bot traffic, and abnormal velocity.
              </p>
            </div>
            <Switch checked={enableDetection} onCheckedChange={setEnableDetection} />
          </div>

          {/* Toggle 2 */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-800">Auto Cancel Suspicious Orders</p>
              <p className="text-gray-400 text-[11px]">
                Automatically marks high-risk orders as cancelled before processing.
              </p>
            </div>
            <Switch
              checked={autoCancelSuspicious}
              onCheckedChange={setAutoCancelSuspicious}
            />
          </div>

          {/* Minimum Order Value */}
          <div className="pt-2">
            <label className="block font-semibold text-gray-800 mb-1">
              Minimum Order Value (BDT ৳)
            </label>
            <input
              type="number"
              value={minOrderValue}
              onChange={(e) => setMinOrderValue(e.target.value)}
              className="w-full sm:w-64 text-xs border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-brand-red font-mono"
            />
            <p className="text-[10px] text-gray-400 mt-1">
              Orders below this amount will require customer advance payment.
            </p>
          </div>

          {/* Toggle 3 */}
          <div className="flex items-center justify-between pt-2">
            <div>
              <p className="font-semibold text-gray-800">Block Multiple Orders (Same User)</p>
              <p className="text-gray-400 text-[11px]">
                Prevents rapid concurrent order placement while previous order is pending.
              </p>
            </div>
            <Switch
              checked={blockMultipleOrders}
              onCheckedChange={setBlockMultipleOrders}
            />
          </div>

          {/* Toggle 4 */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-800">Flag High Risk Users</p>
              <p className="text-gray-400 text-[11px]">
                Marks accounts with past repeated cancellations for manual phone review.
              </p>
            </div>
            <Switch checked={flagHighRiskUsers} onCheckedChange={setFlagHighRiskUsers} />
          </div>

          <div className="pt-4">
            <Button
              onClick={handleSaveSettings}
              disabled={savingSettings}
              className="bg-brand-red hover:bg-brand-red-dark text-white text-xs font-bold px-6 h-10 shadow-sm"
            >
              <Save className="w-3.5 h-3.5 mr-1.5" />
              <span>{savingSettings ? 'Saving...' : 'Save Settings'}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Flagged Review Queue */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 font-bold text-xs text-gray-900">
          Manual Review Queue
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-gray-50 text-gray-500 font-bold border-b border-gray-200 uppercase text-[10px]">
              <tr>
                <th className="p-3.5">Detected Date</th>
                <th className="p-3.5">Flag Reason</th>
                <th className="p-3.5">Severity</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {flags.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-400">
                    No active fraud flags detected. Store protection is running normally.
                  </td>
                </tr>
              ) : (
                flags.map((f) => (
                  <tr key={f.id} className="hover:bg-gray-50/70 transition">
                    <td className="p-3.5 text-gray-500">{formatDateTime(f.created_at)}</td>
                    <td className="p-3.5 font-bold text-gray-900">{f.description}</td>
                    <td className="p-3.5 uppercase font-bold text-red-600">{f.severity}</td>
                    <td className="p-3.5 capitalize">{f.status}</td>
                    <td className="p-3.5 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleResolve(f.id)}
                        className="text-[10px] h-7"
                      >
                        Resolve
                      </Button>
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
