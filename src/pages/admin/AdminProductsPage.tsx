import React, { useEffect, useState } from 'react';
import {
  Package,
  Plus,
  Search,
  Edit,
  Trash2,
  Check,
  Star,
  ExternalLink,
  Upload,
  Image as ImageIcon,
  Sparkles,
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
  getAdminProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from '@/services/admin';
import { getCategories } from '@/services/categories';
import { formatPrice, parsePriceToPaisa, generateSlug } from '@/lib/utils';
import type { Product, Category } from '@/types';
import { toast } from 'sonner';

export const AdminProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formSku, setFormSku] = useState('');
  const [formCategoryId, setFormCategoryId] = useState('');
  const [formRegularPrice, setFormRegularPrice] = useState('');
  const [formSalePrice, setFormSalePrice] = useState('');
  const [formStock, setFormStock] = useState('10');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formShortDesc, setFormShortDesc] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formIsFeatured, setFormIsFeatured] = useState(false);

  const fetchCatalog = async () => {
    setLoading(true);
    try {
      const [res, cats] = await Promise.all([
        getAdminProducts({ page, search: search.trim() || undefined }),
        getCategories(),
      ]);
      setProducts(res.data);
      setCategories(cats);
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalog();
  }, [page]);

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormName('');
    setFormSku(`ME-PR-${Math.floor(100 + Math.random() * 900)}`);
    setFormCategoryId(categories[0]?.id || '');
    setFormRegularPrice('');
    setFormSalePrice('');
    setFormStock('10');
    setFormImageUrl('/assets/logo.png');
    setFormShortDesc('');
    setFormDesc('');
    setFormIsFeatured(false);
    setIsModalOpen(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please choose a valid image file (PNG, JPG, WebP)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image file must be under 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setFormImageUrl(dataUrl);
      toast.success('Image file selected!');
    };
    reader.readAsDataURL(file);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setFormName(p.name);
    setFormSku(p.sku || '');
    setFormCategoryId(p.category_id || '');
    setFormRegularPrice((p.regular_price / 100).toString());
    setFormSalePrice(p.sale_price ? (p.sale_price / 100).toString() : '');
    setFormStock(p.stock_quantity.toString());
    setFormImageUrl(p.images?.[0]?.url || '/assets/logo.png');
    setFormShortDesc(p.short_description || '');
    setFormDesc(p.description || '');
    setFormIsFeatured(p.is_featured);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formRegularPrice) {
      toast.error('Please enter product name and regular price');
      return;
    }

    const regPaisa = parsePriceToPaisa(formRegularPrice);
    const salePaisa = formSalePrice ? parsePriceToPaisa(formSalePrice) : null;
    const stockQty = parseInt(formStock, 10) || 0;

    try {
      if (editingProduct) {
        // Update
        await updateProduct(
          editingProduct.id,
          {
            name: formName.trim(),
            sku: formSku.trim() || null,
            category_id: formCategoryId || null,
            regular_price: regPaisa,
            sale_price: salePaisa,
            stock_quantity: stockQty,
            short_description: formShortDesc.trim() || null,
            description: formDesc.trim() || null,
            is_featured: formIsFeatured,
          },
          formImageUrl
        );
        toast.success(`Product "${formName}" updated!`);
      } else {
        // Create
        await createProduct(
          {
            name: formName.trim(),
            slug: generateSlug(formName) + `-${Date.now().toString().slice(-4)}`,
            sku: formSku.trim() || null,
            category_id: formCategoryId || null,
            regular_price: regPaisa,
            sale_price: salePaisa,
            stock_quantity: stockQty,
            status: 'active',
            short_description: formShortDesc.trim() || null,
            description: formDesc.trim() || null,
            is_featured: formIsFeatured,
          },
          [{ url: formImageUrl || '/assets/logo.png', is_primary: true }]
        );
        toast.success(`Product "${formName}" created successfully!`);
      }
      setIsModalOpen(false);
      fetchCatalog();
    } catch (err: any) {
      toast.error(err.message || 'Operation failed');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to archive "${name}"?`)) return;
    try {
      await deleteProduct(id);
      toast.info(`Product "${name}" archived`);
      fetchCatalog();
    } catch (err: any) {
      toast.error(err.message || 'Failed to archive');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">
            Product Management
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Add new inventory, edit prices, manage variants, and upload product assets.
          </p>
        </div>

        <Button
          onClick={handleOpenAdd}
          className="bg-brand-red hover:bg-brand-red-dark text-white text-xs font-bold px-4 h-9 flex items-center gap-1.5 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-gray-50 text-gray-500 font-bold border-b border-gray-200 uppercase text-[10px]">
              <tr>
                <th className="p-3.5">Image</th>
                <th className="p-3.5">Product Name & SKU</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5">Regular Price</th>
                <th className="p-3.5">Sale Price</th>
                <th className="p-3.5">Stock</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-gray-400">
                    Loading catalog...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-gray-400">
                    No products found.
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                  const img = p.images?.[0]?.url || '/assets/logo.png';
                  return (
                    <tr key={p.id} className="hover:bg-gray-50/70 transition">
                      <td className="p-3.5">
                        <img
                          src={img}
                          alt={p.name}
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = '/assets/logo.png';
                          }}
                          className="w-10 h-10 object-contain bg-gray-50 rounded border border-gray-200 p-0.5"
                        />
                      </td>
                      <td className="p-3.5">
                        <p className="font-bold text-gray-900">{p.name}</p>
                        <p className="text-[10px] text-gray-400 font-mono">{p.sku || 'No SKU'}</p>
                      </td>
                      <td className="p-3.5 text-gray-600">{p.category?.name || 'Unassigned'}</td>
                      <td className="p-3.5 font-bold text-gray-900">{formatPrice(p.regular_price)}</td>
                      <td className="p-3.5 font-bold text-brand-red">
                        {p.sale_price ? formatPrice(p.sale_price) : '—'}
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`font-semibold ${
                            p.stock_quantity <= 0
                              ? 'text-red-600'
                              : p.stock_quantity <= 5
                              ? 'text-orange-500'
                              : 'text-green-600'
                          }`}
                        >
                          {p.stock_quantity} in stock
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-green-100 text-green-700">
                          {p.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(p)}
                            className="p-1.5 text-gray-500 hover:text-brand-red rounded hover:bg-gray-100"
                            aria-label="Edit"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(p.id, p.name)}
                            className="p-1.5 text-gray-500 hover:text-red-600 rounded hover:bg-gray-100"
                            aria-label="Archive"
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

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-gray-900">
                {editingProduct ? `Edit Product: ${editingProduct.name}` : 'Add New Product'}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSave} className="space-y-4 pt-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Product Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Premium Running Shoes"
                    className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-brand-red"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    SKU Code
                  </label>
                  <input
                    type="text"
                    value={formSku}
                    onChange={(e) => setFormSku(e.target.value)}
                    placeholder="ME-RS-001"
                    className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-brand-red font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Category</label>
                  <select
                    value={formCategoryId}
                    onChange={(e) => setFormCategoryId(e.target.value)}
                    className="w-full border border-gray-300 rounded-md p-2 bg-white focus:outline-none focus:ring-1 focus:ring-brand-red"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Regular Price (৳) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formRegularPrice}
                    onChange={(e) => setFormRegularPrice(e.target.value)}
                    placeholder="e.g. 4999"
                    className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-brand-red font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Sale Price (৳) (Optional)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formSalePrice}
                    onChange={(e) => setFormSalePrice(e.target.value)}
                    placeholder="e.g. 3999"
                    className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-brand-red font-bold text-brand-red"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Stock Quantity</label>
                  <input
                    type="number"
                    required
                    value={formStock}
                    onChange={(e) => setFormStock(e.target.value)}
                    className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-brand-red font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Product Image
                  </label>
                  <div className="flex items-center gap-2">
                    <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md font-semibold text-xs border border-gray-300 transition">
                      <Upload className="w-3.5 h-3.5 text-gray-600" />
                      <span>Upload File</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                    <span className="text-[10px] text-gray-400">or enter image link</span>
                  </div>
                  <input
                    type="text"
                    value={formImageUrl}
                    onChange={(e) => setFormImageUrl(e.target.value)}
                    placeholder="https://... or /assets/logo.png"
                    className="w-full border border-gray-300 rounded-md p-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-brand-red font-mono mt-1.5"
                  />
                </div>
              </div>

              {/* Image Live Preview */}
              {formImageUrl && (
                <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg border border-gray-200">
                  <img
                    src={formImageUrl}
                    alt="Product preview"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = '/assets/logo.png';
                    }}
                    className="w-12 h-12 object-contain bg-white rounded border border-gray-200 p-0.5"
                  />
                  <div className="flex-1 text-[11px] text-gray-500 truncate">
                    <p className="font-semibold text-gray-700">Image Preview</p>
                    <p className="truncate font-mono text-[10px] text-gray-400">{formImageUrl.slice(0, 50)}...</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormImageUrl('/assets/logo.png')}
                    className="text-[10px] text-brand-red hover:underline font-semibold"
                  >
                    Reset
                  </button>
                </div>
              )}

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Short Summary</label>
                <input
                  type="text"
                  value={formShortDesc}
                  onChange={(e) => setFormShortDesc(e.target.value)}
                  placeholder="One sentence summary for product cards"
                  className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-brand-red"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Full Description</label>
                <textarea
                  rows={3}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Detailed material, features, and specs"
                  className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-brand-red"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="featuredToggle"
                  checked={formIsFeatured}
                  onChange={(e) => setFormIsFeatured(e.target.checked)}
                  className="w-4 h-4 text-brand-red rounded"
                />
                <label htmlFor="featuredToggle" className="font-semibold text-gray-700 cursor-pointer">
                  Featured Product (Show on homepage spotlight)
                </label>
              </div>

              <DialogFooter className="flex justify-end gap-2">
                <Button size="sm" variant="outline" type="button" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button size="sm" type="submit" className="bg-brand-red hover:bg-brand-red-dark text-white font-bold">
                  {editingProduct ? 'Save Changes' : 'Create Product'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
