import React, { useEffect, useState } from 'react';
import {
  Search,
  Filter,
  Eye,
  CheckCircle2,
  XCircle,
  Truck,
  Package,
  Clock,
  Printer,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getAdminOrders, updateOrderStatus } from '@/services/admin';
import { formatPrice, formatDate, formatDateTime, ORDER_STATUS_CONFIG, PAYMENT_STATUS_CONFIG } from '@/lib/utils';
import { PAYMENT_METHOD_NAMES } from '@/lib/constants';
import type { Order, OrderStatus } from '@/types';
import { toast } from 'sonner';

export const AdminOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);

  // Selected Order for Modal / Invoice
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await getAdminOrders({
        page,
        pageSize: 15,
        status: statusFilter,
        search: search.trim() || undefined,
      });
      setOrders(res.data);
      setTotalCount(res.count);
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [page, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchOrders();
  };

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      toast.success(`Order #${selectedOrder?.order_number || ''} updated to ${newStatus}`);
      fetchOrders();
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to update order status');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">
            Order Management
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            View, fulfill, track, and update customer shipments and invoices.
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Search by order #, email, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs bg-gray-50 border border-gray-300 rounded-md pl-9 pr-4 py-2 focus:outline-none focus:ring-1 focus:ring-brand-red"
          />
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label htmlFor="orderStatusFilter" className="text-xs text-gray-500 whitespace-nowrap">Filter Status:</label>
          <select
            id="orderStatusFilter"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="text-xs border border-gray-300 rounded-md px-3 py-2 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-brand-red w-full sm:w-auto"
          >
            <option value="all">All Orders</option>
            <option value="pending_confirmation">Pending Confirmation</option>
            <option value="confirmed">Confirmed</option>
            <option value="processing">Processing</option>
            <option value="packed">Packed</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-gray-50 text-gray-500 font-bold border-b border-gray-200 uppercase text-[10px]">
              <tr>
                <th className="p-3.5">Order #</th>
                <th className="p-3.5">Customer</th>
                <th className="p-3.5">Destination</th>
                <th className="p-3.5">Total Amount</th>
                <th className="p-3.5">Payment</th>
                <th className="p-3.5">Fulfillment</th>
                <th className="p-3.5">Date</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-gray-400">
                    Loading orders...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-gray-400">
                    No orders found matching the filter criteria.
                  </td>
                </tr>
              ) : (
                orders.map((order) => {
                  const statusCfg = ORDER_STATUS_CONFIG[order.status] || {
                    label: order.status,
                    bgColor: 'bg-gray-100',
                    color: 'text-gray-700',
                  };
                  const payCfg = PAYMENT_STATUS_CONFIG[order.payment_status] || {
                    label: order.payment_status,
                    bgColor: 'bg-gray-100',
                    color: 'text-gray-700',
                  };

                  return (
                    <tr key={order.id} className="hover:bg-gray-50/70 transition">
                      <td className="p-3.5 font-mono font-bold text-gray-900">
                        #{order.order_number}
                      </td>
                      <td className="p-3.5">
                        <p className="font-semibold text-gray-900">
                          {order.shipping_address?.full_name || order.user?.full_name || 'Guest'}
                        </p>
                        <p className="text-[10px] text-gray-400">
                          {order.shipping_address?.phone || order.guest_phone || 'No phone'}
                        </p>
                      </td>
                      <td className="p-3.5 text-gray-600">
                        {order.shipping_address?.district || 'Dhaka'}
                      </td>
                      <td className="p-3.5 font-bold text-gray-900">
                        {formatPrice(order.total_amount)}
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${payCfg.bgColor} ${payCfg.color}`}
                        >
                          {payCfg.label}
                        </span>
                        <p className="text-[9px] text-gray-400 mt-0.5 uppercase">
                          {order.payment_method}
                        </p>
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusCfg.bgColor} ${statusCfg.color}`}
                        >
                          {statusCfg.label}
                        </span>
                      </td>
                      <td className="p-3.5 text-gray-500 text-[11px] whitespace-nowrap">
                        {formatDate(order.created_at)}
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedOrder(order)}
                            className="text-[11px] h-7 px-2.5"
                          >
                            <Eye className="w-3.5 h-3.5 mr-1" />
                            View
                          </Button>

                          {/* Quick Status Dropdown */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-[11px] h-7 px-2 text-gray-600"
                              >
                                <ChevronDown className="w-3.5 h-3.5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="text-xs bg-white">
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(order.id, 'confirmed')}
                              >
                                Mark Confirmed
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(order.id, 'processing')}
                              >
                                Mark Processing
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(order.id, 'shipped')}
                              >
                                Mark Shipped
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(order.id, 'delivered')}
                              >
                                Mark Delivered
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(order.id, 'cancelled')}
                                className="text-red-600 font-bold"
                              >
                                Cancel Order
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader className="border-b border-gray-100 pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle className="text-lg font-black text-gray-900">
                    Order #{selectedOrder.order_number}
                  </DialogTitle>
                  <p className="text-xs text-gray-500">
                    Placed on {formatDateTime(selectedOrder.created_at)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.print()}
                    className="text-xs flex items-center gap-1"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Invoice</span>
                  </Button>
                </div>
              </div>
            </DialogHeader>

            {/* Modal Body */}
            <div className="space-y-6 pt-2 text-xs">
              {/* Delivery Address & Customer Snapshot */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl">
                <div>
                  <h4 className="font-bold text-gray-900 uppercase text-[10px] tracking-wider mb-1">
                    Shipping Address
                  </h4>
                  <p className="font-semibold text-gray-800">
                    {selectedOrder.shipping_address?.full_name}
                  </p>
                  <p className="text-gray-600">{selectedOrder.shipping_address?.phone}</p>
                  <p className="text-gray-600">
                    {selectedOrder.shipping_address?.address_line1}
                  </p>
                  <p className="text-gray-600">
                    {selectedOrder.shipping_address?.city},{' '}
                    {selectedOrder.shipping_address?.district}
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-gray-900 uppercase text-[10px] tracking-wider mb-1">
                    Payment Details
                  </h4>
                  <p className="text-gray-700">
                    Method:{' '}
                    <strong>
                      {PAYMENT_METHOD_NAMES[selectedOrder.payment_method] ||
                        selectedOrder.payment_method}
                    </strong>
                  </p>
                  <p className="text-gray-700">
                    Status: <strong className="uppercase">{selectedOrder.payment_status}</strong>
                  </p>
                  <p className="text-gray-700">
                    Shipping Zone: <strong>{selectedOrder.shipping_method || 'Standard'}</strong>
                  </p>
                </div>
              </div>

              {/* Items Table */}
              <div>
                <h4 className="font-bold text-gray-900 uppercase text-[10px] tracking-wider mb-2">
                  Order Items
                </h4>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50 text-gray-500 border-b border-gray-200 font-semibold">
                      <tr>
                        <th className="p-2.5 text-left">Product</th>
                        <th className="p-2.5 text-center">Qty</th>
                        <th className="p-2.5 text-right">Unit Price</th>
                        <th className="p-2.5 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {selectedOrder.items?.map((item) => (
                        <tr key={item.id}>
                          <td className="p-2.5">
                            <p className="font-semibold text-gray-900">{item.product_name}</p>
                            {item.variant_name && (
                              <p className="text-gray-500 text-[10px]">{item.variant_name}</p>
                            )}
                          </td>
                          <td className="p-2.5 text-center">{item.quantity}</td>
                          <td className="p-2.5 text-right">{formatPrice(item.unit_price)}</td>
                          <td className="p-2.5 text-right font-bold text-gray-900">
                            {formatPrice(item.line_total)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totals */}
              <div className="flex justify-end">
                <div className="w-60 space-y-1.5 text-right">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal:</span>
                    <span className="font-semibold">{formatPrice(selectedOrder.subtotal)}</span>
                  </div>
                  {selectedOrder.discount_amount > 0 && (
                    <div className="flex justify-between text-brand-red font-semibold">
                      <span>Discount:</span>
                      <span>-{formatPrice(selectedOrder.discount_amount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-600">
                    <span>Shipping:</span>
                    <span className="font-semibold">{formatPrice(selectedOrder.shipping_amount)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-gray-200 text-sm font-bold text-gray-900">
                    <span>Total:</span>
                    <span className="text-brand-red">{formatPrice(selectedOrder.total_amount)}</span>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="pt-4 border-t border-gray-100 flex justify-between items-center">
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleStatusChange(selectedOrder.id, 'shipped')}
                  className="text-xs"
                >
                  <Truck className="w-3.5 h-3.5 mr-1" />
                  Mark Shipped
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleStatusChange(selectedOrder.id, 'delivered')}
                  className="bg-green-600 hover:bg-green-700 text-white text-xs"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                  Mark Delivered
                </Button>
              </div>
              <Button size="sm" variant="ghost" onClick={() => setSelectedOrder(null)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
