import React, { useEffect, useState, useMemo } from 'react';
import {
  Boxes,
  PlusCircle,
  ArrowDownCircle,
  ArrowUpCircle,
  Search,
  RotateCcw,
  Trash2,
  AlertCircle,
  Filter,
  RefreshCw,
  SlidersHorizontal,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  getAdminProducts,
  adjustInventory,
  clearProductStock,
  setProductExactStock,
  getInventoryMovements,
} from '@/services/admin';
import { getCategories } from '@/services/categories';
import { formatDateTime } from '@/lib/utils';
import type { Product, Category } from '@/types';
import { toast } from 'sonner';

export const AdminInventoryPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [movements, setMovements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockStatusFilter, setStockStatusFilter] = useState('all');

  // Adjustment Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [adjustType, setAdjustType] = useState<'restock' | 'set_exact' | 'zero_out' | 'adjustment' | 'damaged' | 'return'>('restock');
  const [adjustQty, setAdjustQty] = useState('10');
  const [adjustReason, setAdjustReason] = useState('Warehouse intake');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quick Clear Stock Modal
  const [clearingProduct, setClearingProduct] = useState<Product | null>(null);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const [prodsRes, movs, cats] = await Promise.all([
        getAdminProducts({ pageSize: 100 }),
        getInventoryMovements(),
        getCategories(),
      ]);
      setProducts(prodsRes.data);
      setMovements(movs);
      setCategories(cats);
    } catch (err) {
      console.error('Inventory fetch error:', err);
      toast.error('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleOpenRestock = (p: Product) => {
    setSelectedProduct(p);
    setAdjustType('restock');
    setAdjustQty('10');
    setAdjustReason('Warehouse shipment restock');
    setIsModalOpen(true);
  };

  const handleSaveAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    setIsSubmitting(true);
    try {
      if (adjustType === 'zero_out') {
        await clearProductStock(selectedProduct.id, adjustReason.trim() || 'Stock cleared / zeroed out');
        toast.success(`Stock cleared to 0 for ${selectedProduct.name}`);
      } else if (adjustType === 'set_exact') {
        const targetVal = parseInt(adjustQty, 10);
        if (isNaN(targetVal) || targetVal < 0) {
          toast.error('Please enter a valid non-negative stock count');
          setIsSubmitting(false);
          return;
        }
        await setProductExactStock(selectedProduct.id, targetVal, adjustReason.trim() || 'Manual stock level set');
        toast.success(`Stock updated to ${targetVal} units for ${selectedProduct.name}`);
      } else {
        const qty = parseInt(adjustQty, 10);
        if (isNaN(qty) || qty === 0) {
          toast.error('Please enter a valid quantity');
          setIsSubmitting(false);
          return;
        }
        await adjustInventory({
          productId: selectedProduct.id,
          quantity: adjustType === 'damaged' ? -Math.abs(qty) : qty,
          movementType: adjustType as any,
          reason: adjustReason.trim() || 'Manual adjustment',
        });
        toast.success(`Inventory updated for ${selectedProduct.name}`);
      }
      setIsModalOpen(false);
      fetchInventory();
    } catch (err: any) {
      toast.error(err.message || 'Adjustment failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmClearStock = async () => {
    if (!clearingProduct) return;
    setIsSubmitting(true);
    try {
      await clearProductStock(clearingProduct.id, 'Stock cleared via Quick Action');
      toast.success(`Stock for "${clearingProduct.name}" set to 0 units.`);
      setClearingProduct(null);
      fetchInventory();
    } catch (err: any) {
      toast.error(err.message || 'Failed to clear stock');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.sku && p.sku.toLowerCase().includes(search.toLowerCase()));

      const matchesCat =
        categoryFilter === 'all' ||
        p.category_id === categoryFilter ||
        p.category?.id === categoryFilter;

      let matchesStatus = true;
      if (stockStatusFilter === 'out_of_stock') {
        matchesStatus = p.stock_quantity <= 0;
      } else if (stockStatusFilter === 'low_stock') {
        matchesStatus = p.stock_quantity > 0 && p.stock_quantity <= p.low_stock_threshold;
      } else if (stockStatusFilter === 'in_stock') {
        matchesStatus = p.stock_quantity > p.low_stock_threshold;
      }

      return matchesSearch && matchesCat && matchesStatus;
    });
  }, [products, search, categoryFilter, stockStatusFilter]);

  // Overall Stock Stats
  const totalStockUnits = products.reduce((sum, p) => sum + (p.stock_quantity || 0), 0);
  const outOfStockCount = products.filter((p) => p.stock_quantity <= 0).length;
  const lowStockCount = products.filter(
    (p) => p.stock_quantity > 0 && p.stock_quantity <= p.low_stock_threshold
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">
            Inventory & Stock Management
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Monitor real-time stock balances by category, intake shipments, zero out inventory, and audit movement logs.
          </p>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={fetchInventory}
          className="text-gray-600 border-gray-200 hover:bg-gray-50 text-xs h-9"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Stock
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs">
          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Total Products</p>
          <p className="text-2xl font-black text-gray-900 mt-1">{products.length}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs">
          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Total Units in Stock</p>
          <p className="text-2xl font-black text-blue-600 mt-1">{totalStockUnits.toLocaleString()}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs">
          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Low Stock Warnings</p>
          <p className="text-2xl font-black text-orange-600 mt-1">{lowStockCount}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs">
          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Out of Stock</p>
          <p className="text-2xl font-black text-red-600 mt-1">{outOfStockCount}</p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by product name or SKU..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-red bg-gray-50/50"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Category Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-gray-600">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-brand-red font-medium"
            >
              <option value="all">All Categories ({categories.length})</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Stock Status Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-gray-600">Stock Status:</span>
            <select
              value={stockStatusFilter}
              onChange={(e) => setStockStatusFilter(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-brand-red font-medium"
            >
              <option value="all">All Stock Statuses</option>
              <option value="in_stock">In Stock (&gt; threshold)</option>
              <option value="low_stock">Low Stock (≤ threshold)</option>
              <option value="out_of_stock">Out of Stock (0 units)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stock Balances Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div className="font-bold text-xs text-gray-900">
            Stock Levels ({filteredProducts.length} items)
          </div>
          <span className="text-[11px] text-gray-400">
            Click "Adjust / Restock" to add units or "Clear Stock" to zero out
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-gray-50 text-gray-500 font-bold border-b border-gray-200 uppercase text-[10px]">
              <tr>
                <th className="p-3.5">Product & SKU</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5">Available Stock</th>
                <th className="p-3.5">Low Stock Warning</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-gray-300" />
                    Loading inventory balances...
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-400">
                    No products found matching the selected filters.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50/70 transition">
                    <td className="p-3.5">
                      <p className="font-bold text-gray-900">{p.name}</p>
                      <p className="text-[10px] text-gray-400 font-mono">{p.sku}</p>
                    </td>
                    <td className="p-3.5 text-gray-600 font-medium">
                      <span className="inline-block px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-[11px]">
                        {p.category?.name || 'General'}
                      </span>
                    </td>
                    <td className="p-3.5 font-bold text-gray-900">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded text-xs font-mono font-bold ${
                          p.stock_quantity <= 0
                            ? 'bg-red-100 text-red-700 border border-red-200'
                            : p.stock_quantity <= p.low_stock_threshold
                            ? 'bg-orange-100 text-orange-700 border border-orange-200'
                            : 'bg-green-100 text-green-700 border border-green-200'
                        }`}
                      >
                        {p.stock_quantity} units
                      </span>
                    </td>
                    <td className="p-3.5 text-gray-500 font-mono">
                      Threshold: {p.low_stock_threshold}
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          onClick={() => handleOpenRestock(p)}
                          className="bg-brand-red hover:bg-brand-red-dark text-white text-[11px] h-7 px-3 font-bold shadow-xs"
                        >
                          Adjust / Restock
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setClearingProduct(p)}
                          disabled={p.stock_quantity === 0}
                          title={p.stock_quantity === 0 ? 'Stock is already 0' : 'Clear stock to 0'}
                          className="text-red-600 border-red-200 hover:bg-red-50 text-[11px] h-7 px-2.5 font-semibold"
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-1" />
                          Clear Stock
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Movement Ledger */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 font-bold text-xs text-gray-900 flex items-center justify-between">
          <span>Recent Inventory Movement Ledger</span>
          <span className="text-[10px] text-gray-400 font-normal">Last 50 recorded adjustments</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-gray-50 text-gray-500 font-bold border-b border-gray-200 uppercase text-[10px]">
              <tr>
                <th className="p-3.5">Date & Time</th>
                <th className="p-3.5">Product</th>
                <th className="p-3.5">Movement Type</th>
                <th className="p-3.5">Quantity Change</th>
                <th className="p-3.5">Before → After</th>
                <th className="p-3.5">Reason / Performer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {movements.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-gray-400">
                    No movements recorded yet.
                  </td>
                </tr>
              ) : (
                movements.map((m) => (
                  <tr key={m.id} className="hover:bg-gray-50/70 transition">
                    <td className="p-3.5 text-gray-500 whitespace-nowrap font-mono text-[11px]">
                      {formatDateTime(m.created_at)}
                    </td>
                    <td className="p-3.5 font-bold text-gray-900">{m.product?.name || 'Product'}</td>
                    <td className="p-3.5 capitalize font-semibold text-gray-700">
                      <span className="px-2 py-0.5 rounded bg-gray-100 text-[10px]">
                        {m.movement_type.replace('_', ' ')}
                      </span>
                    </td>
                    <td
                      className={`p-3.5 font-mono font-bold ${
                        m.quantity > 0 ? 'text-green-600' : m.quantity < 0 ? 'text-red-600' : 'text-gray-500'
                      }`}
                    >
                      {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                    </td>
                    <td className="p-3.5 text-gray-600 font-mono">
                      {m.stock_before} → {m.stock_after}
                    </td>
                    <td className="p-3.5 text-gray-500 text-[11px]">
                      <p className="font-medium text-gray-700">{m.reason || '—'}</p>
                      {m.performer && (
                        <p className="text-[10px] text-gray-400">By: {m.performer.full_name || m.performer.email}</p>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adjust Inventory Modal */}
      {isModalOpen && selectedProduct && (
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-gray-900">
                Adjust Inventory: {selectedProduct.name}
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-500">
                Current Stock Level: <strong className="text-gray-900">{selectedProduct.stock_quantity} units</strong> ({selectedProduct.category?.name || 'General'})
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSaveAdjustment} className="space-y-4 pt-2 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Adjustment Action</label>
                <select
                  value={adjustType}
                  onChange={(e: any) => {
                    const val = e.target.value;
                    setAdjustType(val);
                    if (val === 'zero_out') {
                      setAdjustQty('0');
                      setAdjustReason('Stock cleared to zero');
                    } else if (val === 'set_exact') {
                      setAdjustQty(selectedProduct.stock_quantity.toString());
                      setAdjustReason('Physical stock count update');
                    } else if (val === 'damaged') {
                      setAdjustReason('Damaged or expired inventory deduction');
                    } else if (val === 'return') {
                      setAdjustReason('Customer return restocking');
                    } else {
                      setAdjustReason('Warehouse intake');
                    }
                  }}
                  className="w-full border border-gray-300 rounded-md p-2 bg-white focus:outline-none focus:ring-1 focus:ring-brand-red font-medium"
                >
                  <option value="restock">Restock / Add Units (+)</option>
                  <option value="set_exact">Direct Set (Set Exact Target Stock Number)</option>
                  <option value="zero_out">Clear Stock (Zero Out Stock to 0)</option>
                  <option value="damaged">Damaged / Lost Stock (Deduct -)</option>
                  <option value="adjustment">Manual Adjustment (+ or -)</option>
                  <option value="return">Customer Return (+)</option>
                </select>
              </div>

              {adjustType !== 'zero_out' && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-gray-700">
                      {adjustType === 'set_exact'
                        ? 'New Target Stock Quantity'
                        : 'Quantity Change'}
                    </label>
                    {adjustType === 'restock' && (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setAdjustQty('5')}
                          className="px-1.5 py-0.5 rounded text-[10px] bg-gray-100 hover:bg-gray-200 text-gray-700"
                        >
                          +5
                        </button>
                        <button
                          type="button"
                          onClick={() => setAdjustQty('10')}
                          className="px-1.5 py-0.5 rounded text-[10px] bg-gray-100 hover:bg-gray-200 text-gray-700"
                        >
                          +10
                        </button>
                        <button
                          type="button"
                          onClick={() => setAdjustQty('25')}
                          className="px-1.5 py-0.5 rounded text-[10px] bg-gray-100 hover:bg-gray-200 text-gray-700"
                        >
                          +25
                        </button>
                        <button
                          type="button"
                          onClick={() => setAdjustQty('50')}
                          className="px-1.5 py-0.5 rounded text-[10px] bg-gray-100 hover:bg-gray-200 text-gray-700"
                        >
                          +50
                        </button>
                      </div>
                    )}
                  </div>
                  <input
                    type="number"
                    required
                    value={adjustQty}
                    onChange={(e) => setAdjustQty(e.target.value)}
                    className="w-full border border-gray-300 rounded-md p-2 font-mono font-bold text-sm focus:outline-none focus:ring-1 focus:ring-brand-red"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">
                    {adjustType === 'set_exact'
                      ? `Stock will change from ${selectedProduct.stock_quantity} to ${adjustQty || 0} units`
                      : adjustType === 'damaged'
                      ? `Will deduct ${adjustQty || 0} units from stock`
                      : `Will add ${adjustQty || 0} units to current stock`}
                  </p>
                </div>
              )}

              {adjustType === 'zero_out' && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-bold">Zero Out All Stock</p>
                    <p className="text-[11px] text-red-600 mt-0.5">
                      This will reset available stock from {selectedProduct.stock_quantity} to 0 units. Shoppers will see this item as Out of Stock.
                    </p>
                  </div>
                </div>
              )}

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Reason / Notes</label>
                <input
                  type="text"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="e.g. Received shipment lot #402"
                  className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-brand-red"
                />
              </div>

              <DialogFooter className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <Button size="sm" variant="outline" type="button" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  type="submit"
                  disabled={isSubmitting}
                  className={`font-bold text-white ${
                    adjustType === 'zero_out'
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-brand-red hover:bg-brand-red-dark'
                  }`}
                >
                  {isSubmitting
                    ? 'Updating...'
                    : adjustType === 'zero_out'
                    ? 'Clear Stock to 0'
                    : 'Confirm Adjustment'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Quick Clear Stock Confirmation Dialog */}
      {clearingProduct && (
        <Dialog open={!!clearingProduct} onOpenChange={() => setClearingProduct(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircle className="w-5 h-5" />
                <DialogTitle className="text-base font-bold text-gray-900">
                  Clear Stock: {clearingProduct.name}
                </DialogTitle>
              </div>
              <DialogDescription className="text-xs text-gray-600 pt-2">
                Are you sure you want to clear / zero out all stock for <strong>"{clearingProduct.name}"</strong>?
                <br /><br />
                Current stock: <strong>{clearingProduct.stock_quantity} units</strong>. It will immediately become <strong>0 units</strong>.
              </DialogDescription>
            </DialogHeader>

            <DialogFooter className="flex justify-end gap-2 pt-3 border-t border-gray-100">
              <Button size="sm" variant="outline" onClick={() => setClearingProduct(null)}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleConfirmClearStock}
                disabled={isSubmitting}
                className="bg-red-600 hover:bg-red-700 text-white font-bold"
              >
                {isSubmitting ? 'Clearing...' : 'Confirm Clear to 0'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
