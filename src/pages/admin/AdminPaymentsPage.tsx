import React, { useEffect, useState } from 'react';
import {
  CreditCard,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Search,
  Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { getPaymentClaims, verifyPaymentClaim } from '@/services/admin';
import { formatPrice, formatDateTime, PAYMENT_STATUS_CONFIG } from '@/lib/utils';
import type { PaymentClaim } from '@/types';
import { toast } from 'sonner';

export const AdminPaymentsPage: React.FC = () => {
  const [claims, setClaims] = useState<PaymentClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  // Rejection modal state
  const [rejectingClaim, setRejectingClaim] = useState<PaymentClaim | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const fetchClaims = async () => {
    setLoading(true);
    try {
      const data = await getPaymentClaims(statusFilter === 'all' ? undefined : statusFilter);
      setClaims(data);
    } catch (err) {
      console.error('Error loading claims:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClaims();
  }, [statusFilter]);

  const handleApprove = async (claim: PaymentClaim) => {
    try {
      await verifyPaymentClaim(claim.id, claim.order_id, true, 'Payment verified by administrator');
      toast.success(`Payment claim #${claim.transaction_id || ''} approved and marked Paid!`);
      fetchClaims();
    } catch (err: any) {
      toast.error(err.message || 'Verification failed');
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectingClaim) return;
    try {
      await verifyPaymentClaim(
        rejectingClaim.id,
        rejectingClaim.order_id,
        false,
        'Payment claim rejected',
        rejectReason || 'Transaction ID not verified'
      );
      toast.info('Payment claim rejected');
      setRejectingClaim(null);
      setRejectReason('');
      fetchClaims();
    } catch (err: any) {
      toast.error(err.message || 'Action failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">
            Payment Verification (bKash / Nagad / Rocket)
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Review customer transaction claims against mobile banking statements before shipping.
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-2">
          {['all', 'payment_submitted', 'paid', 'rejected'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold capitalize transition ${
                statusFilter === st
                  ? 'bg-brand-red text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {st.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Claims Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-gray-50 text-gray-500 font-bold border-b border-gray-200 uppercase text-[10px]">
              <tr>
                <th className="p-3.5">Method</th>
                <th className="p-3.5">Transaction ID</th>
                <th className="p-3.5">Sender Number</th>
                <th className="p-3.5">Amount Claimed</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Submitted Date</th>
                <th className="p-3.5 text-right">Verification Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-400">
                    Loading claims...
                  </td>
                </tr>
              ) : claims.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-400">
                    No payment claims found in this view.
                  </td>
                </tr>
              ) : (
                claims.map((claim) => {
                  const cfg = PAYMENT_STATUS_CONFIG[claim.status] || {
                    label: claim.status,
                    bgColor: 'bg-gray-100',
                    color: 'text-gray-700',
                  };

                  return (
                    <tr key={claim.id} className="hover:bg-gray-50/70 transition">
                      <td className="p-3.5 font-bold uppercase text-brand-red">
                        {claim.payment_method}
                      </td>
                      <td className="p-3.5 font-mono font-bold text-gray-900 bg-gray-50/50">
                        {claim.transaction_id || 'N/A'}
                      </td>
                      <td className="p-3.5 font-mono text-gray-700">
                        {claim.sender_number || 'N/A'}
                      </td>
                      <td className="p-3.5 font-bold text-gray-900">
                        {formatPrice(claim.amount_claimed)}
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${cfg.bgColor} ${cfg.color}`}
                        >
                          {cfg.label}
                        </span>
                      </td>
                      <td className="p-3.5 text-gray-500 text-[11px] whitespace-nowrap">
                        {formatDateTime(claim.created_at)}
                      </td>
                      <td className="p-3.5 text-right">
                        {claim.status === 'payment_submitted' || claim.status === 'under_review' ? (
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleApprove(claim)}
                              className="bg-green-600 hover:bg-green-700 text-white text-[10px] h-7 px-2.5 font-bold"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setRejectingClaim(claim)}
                              className="border-red-200 text-red-600 hover:bg-red-50 text-[10px] h-7 px-2.5 font-bold"
                            >
                              <XCircle className="w-3.5 h-3.5 mr-1" />
                              Reject
                            </Button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-gray-400 italic">
                            Reviewed ({claim.status})
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reject Modal */}
      {rejectingClaim && (
        <Dialog open={!!rejectingClaim} onOpenChange={() => setRejectingClaim(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-gray-900">
                Reject Payment Claim #{rejectingClaim.transaction_id}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-2 text-xs">
              <label className="block text-gray-700 font-semibold">
                Reason for rejection:
              </label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Transaction ID was not found in our bKash statement"
                className="w-full border border-gray-300 rounded-md p-2 text-xs focus:outline-none focus:ring-1 focus:ring-brand-red"
              />
            </div>
            <DialogFooter className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setRejectingClaim(null)}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleConfirmReject}
                className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold"
              >
                Confirm Rejection
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
