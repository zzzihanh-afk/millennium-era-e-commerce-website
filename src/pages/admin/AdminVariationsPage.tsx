import React, { useEffect, useState, useMemo } from 'react';
import {
  Layers,
  Plus,
  Search,
  Edit2,
  Trash2,
  Package,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Tag,
  Boxes,
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
  getAdminProductVariants,
  createProductVariant,
  updateProductVariant,
  deleteProductVariant,
  getAdminProducts,
} from '@/services/admin';
import { formatPrice, parsePriceToPaisa } from '@/lib/utils';
import type { Product, ProductVariant } from '@/types';
import { toast } from 'sonner';

export const AdminVariationsPage: React.FC = () => {
  const [variants, setVariants] = useState<any[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [productFilter, setProductFilter] = useState('all');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVariant, setEditingVariant] = useState<any | null>(null);
  const [deletingVariant, setDeletingVariant] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [formProductId, setFormProductId] = useState('');
  const [formName, setFormName] = useState('');
  const [formSku, setFormSku] = useState('');
  const [formRegularPrice, setFormRegularPrice] = useState('');
  const [formSalePrice, setFormSalePrice] = useState('');
  const [formStock, setFormStock] = useState('10');
  const [formLowStock, setFormLowStock] = useState('5');
  const [formIsActive, setFormIsActive] = useState(true);

  const fetchCatalog = async () => {
    setLoading(true);
    try {
      const [vData, pData] = await Promise.all([
        getAdminProductVariants(productFilter === 'all' ? undefined : productFilter),
        getAdminProducts({ pageSize: 100 }),
      ]);
      setVariants(vData);
      setProducts(pData.data);
    } catch (err: any) {
      console.error('Error fetching variants:', err);
      toast.error('Failed to load variations: ' + (err.message || 'Check database connection'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalog();
  }, [productFilter]);

  const handleOpenAdd = () => {
    setEditingVariant(null);
    const firstProd = products[0];
    setFormProductId(firstProd?.id || '');
    setFormName('');
    setFormSku(firstProd ? `${firstProd.sku || 'ME'}-VAR-${Math.floor(100 + Math.random() * 900)}` : 'ME-VAR-101');
    setFormRegularPrice(firstProd ? (firstProd.regular_price / 100).toString() : '999');
    setFormSalePrice(firstProd?.sale_price ? (firstProd.sale_price / 100).toString() : '');
    setFormStock('15');
    setFormLowStock('5');
    setFormIsActive(true);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (v: any) => {
    setEditingVariant(v);
    setFormProductId(v.product_id);
    setFormName(v.name || '');
    setFormSku(v.sku || '');
    setFormRegularPrice((v.regular_price / 100).toString());
    setFormSalePrice(v.sale_price ? (v.sale_price / 100).toString() : '');
    setFormStock(v.stock_quantity.toString());
    setFormLowStock((v.low_stock_threshold || 5).toString());
    setFormIsActive(v.is_active ?? true);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formProductId) {
      toast.error('Please select a product');
      return;
    }
    if (!formName.trim()) {
      toast.error('Please enter a variation name (e.g. Red / XL)');
      return;
    }
    if (!formSku.trim()) {
      toast.error('Please enter a unique SKU code');
      return;
    }
    if (!formRegularPrice) {
      toast.error('Please enter regular price');
      return;
    }

    setIsSubmitting(true);
    const regPaisa = parsePriceToPaisa(formRegularPrice);
    const salePaisa = formSalePrice ? parsePriceToPaisa(formSalePrice) : null;
    const stockQty = parseInt(formStock, 10) || 0;
    const lowStockQty = parseInt(formLowStock, 10) || 5;

    try {
      if (editingVariant) {
        await updateProductVariant(editingVariant.id, {
          name: formName.trim(),
          sku: formSku.trim(),
          regular_price: regPaisa,
          sale_price: salePaisa,
          stock_quantity: stockQty,
          low_stock_threshold: lowStockQty,
          is_active: formIsActive,
        });
        toast.success(`Variation "${formName}" updated successfully!`);
      } else {
        await createProductVariant({
          product_id: formProductId,
          name: formName.trim(),
          sku: formSku.trim(),
          regular_price: regPaisa,
          sale_price: salePaisa,
          stock_quantity: stockQty,
          low_stock_threshold: lowStockQty,
          is_active: formIsActive,
        });
        toast.success(`Variation "${formName}" created successfully!`);
      }
      setIsModalOpen(false);
      fetchCatalog();
    } catch (err: any) {
      toast.error(err.message || 'Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingVariant) return;
    setIsSubmitting(true);
    try {
      await deleteProductVariant(deletingVariant.id);
      toast.success(`Variation "${deletingVariant.name || deletingVariant.sku}" deleted!`);
      setDeletingVariant(null);
      fetchCatalog();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete variation');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredVariants = useMemo(() => {
    return variants.filter((v) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        v.name?.toLowerCase().includes(q) ||
        v.sku?.toLowerCase().includes(q) ||
        v.product?.name?.toLowerCase().includes(q);
      return matchSearch;
    });
  }, [variants, search]);

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-brand-charcoal text-brand-gold flex items-center justify-center shadow-sm">
              <Layers className="w-5 h-5 text-brand-gold" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                <span>Product Variations Builder</span>
                <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-50 text-brand-red border border-red-200">
                  SKU & Matrix
                </span>
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">
                Configure size, color, and storage combinations with dedicated SKUs, individual stock levels, and custom prices.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchCatalog}
            className="text-xs border-gray-300 hover:bg-gray-50 text-gray-700"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button
            onClick={handleOpenAdd}
            className="bg-brand-red hover:bg-red-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 px-4"
          >
            <Plus className="w-4 h-4" />
            <span>Add Variation</span>
          </Button>
        </div>
      </div>

      {/* 2. Filters & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Search by variation, SKU, product..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs bg-gray-50 border border-gray-300 rounded-lg pl-9 pr-4 py-2 focus:outline-none focus:ring-1 focus:ring-brand-red focus:bg-white transition"
          />
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-gray-500 whitespace-nowrap">Parent Product:</span>
          <select
            value={productFilter}
            onChange={(e) => setProductFilter(e.target.value)}
            className="text-xs bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-brand-red max-w-xs truncate"
          >
            <option value="all">All Products ({products.length})</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 3. Variations Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Parent Product</th>
                <th className="py-3 px-4">Variation / Attributes</th>
                <th className="py-3 px-4">SKU Code</th>
                <th className="py-3 px-4">Regular Price</th>
                <th className="py-3 px-4">Sale Price</th>
                <th className="py-3 px-4">Stock Level</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-brand-red mb-2" />
                    <span>Loading variations catalogue...</span>
                  </td>
                </tr>
              ) : filteredVariants.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400">
                    <Boxes className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                    <p className="text-sm font-semibold text-gray-700">No variations configured yet</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Click "Add Variation" to configure size, color, or style options for your products.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredVariants.map((v) => {
                  const isLow = v.stock_quantity <= (v.low_stock_threshold || 5) && v.stock_quantity > 0;
                  const isOut = v.stock_quantity <= 0;

                  return (
                    <tr key={v.id} className="hover:bg-gray-50/70 transition-colors">
                      {/* Product Name */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <div>
                            <p className="font-bold text-gray-900 leading-tight">
                              {v.product?.name || 'Unlinked Product'}
                            </p>
                            <p className="text-[10px] text-gray-400 mt-0.5">
                              {v.product?.category?.name || 'Category'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Variation Name */}
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-gray-900 bg-gray-100 px-2 py-1 rounded border border-gray-200">
                          {v.name || 'Default Variant'}
                        </span>
                      </td>

                      {/* SKU */}
                      <td className="py-3.5 px-4">
                        <span className="font-mono text-xs text-gray-600 bg-gray-50 px-2 py-0.5 rounded border border-gray-200">
                          {v.sku}
                        </span>
                      </td>

                      {/* Regular Price */}
                      <td className="py-3.5 px-4 font-bold text-gray-900">
                        {formatPrice(v.regular_price)}
                      </td>

                      {/* Sale Price */}
                      <td className="py-3.5 px-4 font-bold text-brand-red">
                        {v.sale_price ? formatPrice(v.sale_price) : '—'}
                      </td>

                      {/* Stock Level */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                            isOut
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : isLow
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}
                        >
                          {v.stock_quantity} in stock
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {v.is_active ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full border border-gray-200">
                            Inactive
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(v)}
                            className="p-1.5 text-gray-500 hover:text-brand-red rounded hover:bg-gray-100 transition"
                            title="Edit Variation"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingVariant(v)}
                            className="p-1.5 text-gray-500 hover:text-red-600 rounded hover:bg-red-50 transition"
                            title="Delete Variation"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
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

      {/* ============================================================ */}
      {/* MODAL 1: ADD / EDIT PRODUCT VARIATION */}
      {/* ============================================================ */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-red-50 text-brand-red flex items-center justify-center">
                <Layers className="w-4 h-4 text-brand-red" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-gray-900">
                  {editingVariant ? `Edit Variation: ${editingVariant.name}` : 'Add Product Variation'}
                </DialogTitle>
                <DialogDescription className="text-xs text-gray-500">
                  Assign specific size, color, price point, and stock balance to this SKU.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4 pt-3 text-xs">
            {/* Parent Product Selector */}
            <div>
              <label className="block font-bold text-gray-700 mb-1">
                Parent Product <span className="text-brand-red">*</span>
              </label>
              <select
                value={formProductId}
                disabled={!!editingVariant}
                onChange={(e) => {
                  setFormProductId(e.target.value);
                  const p = products.find((prod) => prod.id === e.target.value);
                  if (p) {
                    setFormSku(`${p.sku || 'ME'}-VAR-${Math.floor(100 + Math.random() * 900)}`);
                    setFormRegularPrice((p.regular_price / 100).toString());
                    setFormSalePrice(p.sale_price ? (p.sale_price / 100).toString() : '');
                  }
                }}
                className="w-full border border-gray-300 rounded-md p-2 bg-white focus:outline-none focus:ring-1 focus:ring-brand-red disabled:bg-gray-100"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.sku || 'No SKU'})
                  </option>
                ))}
              </select>
            </div>

            {/* Variation Name & SKU */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Variation Name <span className="text-brand-red">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Red / Medium or 256GB"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-brand-red"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Unique SKU <span className="text-brand-red">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ME-RS-001-RED-M"
                  value={formSku}
                  onChange={(e) => setFormSku(e.target.value)}
                  className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-brand-red font-mono"
                />
              </div>
            </div>

            {/* Price Inputs */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Regular Price (৳) <span className="text-brand-red">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formRegularPrice}
                  onChange={(e) => setFormRegularPrice(e.target.value)}
                  placeholder="e.g. 3999"
                  className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-brand-red font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Sale Price (৳) (Optional)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formSalePrice}
                  onChange={(e) => setFormSalePrice(e.target.value)}
                  placeholder="e.g. 2999"
                  className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-brand-red font-bold text-brand-red"
                />
              </div>
            </div>

            {/* Stock Inputs */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Stock Quantity</label>
                <input
                  type="number"
                  required
                  value={formStock}
                  onChange={(e) => setFormStock(e.target.value)}
                  className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-brand-red font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Low Stock Alert Threshold</label>
                <input
                  type="number"
                  value={formLowStock}
                  onChange={(e) => setFormLowStock(e.target.value)}
                  className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-brand-red"
                />
              </div>
            </div>

            {/* Active Toggle */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="varActiveToggle"
                checked={formIsActive}
                onChange={(e) => setFormIsActive(e.target.checked)}
                className="w-4 h-4 text-brand-red rounded focus:ring-brand-red"
              />
              <label htmlFor="varActiveToggle" className="font-semibold text-gray-700 cursor-pointer">
                Variation Active for Purchase
              </label>
            </div>

            <DialogFooter className="flex justify-end gap-2">
              <Button size="sm" variant="outline" type="button" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                type="submit"
                disabled={isSubmitting}
                className="bg-brand-red hover:bg-brand-red-dark text-white font-bold"
              >
                {isSubmitting ? 'Saving...' : editingVariant ? 'Save Changes' : 'Create Variation'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ============================================================ */}
      {/* MODAL 2: CONFIRM DELETE VARIATION */}
      {/* ============================================================ */}
      <Dialog open={!!deletingVariant} onOpenChange={(open) => !open && setDeletingVariant(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-red-50 text-brand-red flex items-center justify-center">
                <AlertCircle className="w-4 h-4 text-brand-red" />
              </div>
              <DialogTitle className="text-base font-bold text-gray-900">
                Delete Product Variation?
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-gray-500 pt-2">
              Are you sure you want to delete variation{' '}
              <strong className="text-gray-800">{deletingVariant?.name || deletingVariant?.sku}</strong>?
              This will remove this sellable SKU and its inventory from the store.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeletingVariant(null)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={isSubmitting}
              onClick={handleConfirmDelete}
              className="text-xs font-bold"
            >
              {isSubmitting ? 'Deleting...' : 'Delete Variation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
