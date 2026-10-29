import React, { useEffect, useState, useMemo } from 'react';
import {
  FolderTree,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Search,
  Upload,
  AlertCircle,
  RefreshCw,
  Layers,
  ArrowRight,
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
import { getCategories } from '@/services/categories';
import { createCategory, updateCategory, deleteCategory } from '@/services/admin';
import { generateSlug } from '@/lib/utils';
import { DEMO_CATEGORIES } from '@/lib/demoData';
import type { Category } from '@/types';
import { toast } from 'sonner';

export const AdminCategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>(DEMO_CATEGORIES);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  // Add / Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formOrder, setFormOrder] = useState('1');

  // Deletion Modal
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [reassignTargetId, setReassignTargetId] = useState<string>('null');

  const fetchCats = async () => {
    setLoading(true);
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (err) {
      console.error('Error fetching categories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCats();
  }, []);

  const handleOpenAdd = () => {
    setEditingCategory(null);
    setFormName('');
    setFormSlug('');
    setFormDescription('');
    setFormImageUrl('/assets/logo.png');
    setFormOrder((categories.length + 1).toString());
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: Category) => {
    setEditingCategory(c);
    setFormName(c.name);
    setFormSlug(c.slug);
    setFormDescription(c.description || '');
    setFormImageUrl(c.image_url || '/assets/logo.png');
    setFormOrder((c.display_order ?? 1).toString());
    setIsModalOpen(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setFormImageUrl(event.target?.result as string);
      toast.success('Category image selected!');
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      toast.error('Category name is required');
      return;
    }

    const slug = formSlug.trim() || generateSlug(formName);
    const order = parseInt(formOrder, 10) || categories.length + 1;

    setIsSubmitting(true);
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, {
          name: formName.trim(),
          slug,
          description: formDescription.trim() || null,
          image_url: formImageUrl.trim() || null,
          display_order: order,
        });
        toast.success(`Category "${formName}" updated!`);
      } else {
        await createCategory({
          name: formName.trim(),
          slug,
          description: formDescription.trim() || null,
          image_url: formImageUrl.trim() || null,
          display_order: order,
          is_active: true,
        });
        toast.success(`Category "${formName}" created!`);
      }
      setIsModalOpen(false);
      fetchCats();
    } catch (err: any) {
      toast.error(err.message || 'Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingCategory) return;
    setIsSubmitting(true);
    try {
      const targetCatId = reassignTargetId === 'null' ? null : reassignTargetId;
      await deleteCategory(deletingCategory.id, targetCatId);
      toast.success(`Category "${deletingCategory.name}" removed successfully.`);
      setDeletingCategory(null);
      fetchCats();
    } catch (err: any) {
      toast.error(err.message || 'Deletion failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered categories
  const filteredCategories = useMemo(() => {
    return categories.filter((c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.slug.toLowerCase().includes(search.toLowerCase())
    );
  }, [categories, search]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">
            Category Management
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Organize products into departments, manage navigation menus, icons, and delete categories safely.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={fetchCats}
            className="text-gray-600 border-gray-200 hover:bg-gray-50 text-xs h-9"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button
            onClick={handleOpenAdd}
            className="bg-brand-red hover:bg-brand-red-dark text-white text-xs font-bold px-4 h-9 flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Category</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs">
          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Total Categories</p>
          <p className="text-2xl font-black text-gray-900 mt-1">{categories.length}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs">
          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Active Navigation Links</p>
          <p className="text-2xl font-black text-emerald-600 mt-1">
            {categories.filter((c) => c.is_active).length}
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs">
          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Catalog Coverage</p>
          <p className="text-2xl font-black text-blue-600 mt-1">100%</p>
        </div>
      </div>

      {/* Search Toolbar */}
      <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-xs flex items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search categories by name or slug..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-red bg-gray-50/50"
          />
        </div>
        <span className="text-xs text-gray-500 font-medium">
          Showing {filteredCategories.length} categories
        </span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-gray-50 text-gray-500 font-bold border-b border-gray-200 uppercase text-[10px]">
              <tr>
                <th className="p-3.5">ID</th>
                <th className="p-3.5">Category Name</th>
                <th className="p-3.5">Icon / Image</th>
                <th className="p-3.5">Slug</th>
                <th className="p-3.5">Display Order</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-gray-300" />
                    Loading categories...
                  </td>
                </tr>
              ) : filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-400">
                    No categories found. Click "Add Category" above to add one.
                  </td>
                </tr>
              ) : (
                filteredCategories.map((c, index) => (
                  <tr key={c.id} className="hover:bg-gray-50/70 transition">
                    <td className="p-3.5 font-mono text-gray-400 font-semibold">
                      #{String(index + 1).padStart(4, '0')}
                    </td>
                    <td className="p-3.5 font-bold text-gray-900">{c.name}</td>
                    <td className="p-3.5">
                      <div className="w-8 h-8 rounded-full border border-gray-200 bg-white flex items-center justify-center overflow-hidden p-0.5 shadow-xs">
                        {c.image_url ? (
                          <img
                            src={c.image_url}
                            alt={c.name}
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = '/assets/logo.png';
                            }}
                            className="w-full h-full object-cover rounded-full"
                          />
                        ) : (
                          <FolderTree className="w-4 h-4 text-brand-red" />
                        )}
                      </div>
                    </td>
                    <td className="p-3.5 font-mono text-gray-500">{c.slug}</td>
                    <td className="p-3.5 font-mono text-gray-700">#{c.display_order ?? index + 1}</td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-green-100 text-green-700">
                        Active
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenEdit(c)}
                          className="h-7 px-2.5 text-gray-600 hover:text-brand-red text-xs"
                        >
                          <Edit2 className="w-3.5 h-3.5 mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setDeletingCategory(c);
                            const otherCats = categories.filter((other) => other.id !== c.id);
                            setReassignTargetId(otherCats[0]?.id || 'null');
                          }}
                          className="h-7 px-2.5 text-red-600 border-red-200 hover:bg-red-50 text-xs"
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-1" />
                          Delete
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

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-gray-900">
                {editingCategory ? `Edit Category: ${editingCategory.name}` : 'New Category'}
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-500">
                Set category details, navigation slug, and banner thumbnail.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSave} className="space-y-4 pt-2 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Category Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => {
                    setFormName(e.target.value);
                    if (!editingCategory) setFormSlug(generateSlug(e.target.value));
                  }}
                  placeholder="e.g. Fashion & Apparel"
                  className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-brand-red font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">URL Slug</label>
                <input
                  type="text"
                  value={formSlug}
                  onChange={(e) => setFormSlug(e.target.value)}
                  placeholder="fashion-apparel"
                  className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-brand-red font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Display Order</label>
                <input
                  type="number"
                  value={formOrder}
                  onChange={(e) => setFormOrder(e.target.value)}
                  min="1"
                  className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-brand-red font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Category Image / Icon</label>
                <div className="flex items-center gap-2 mb-1.5">
                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md font-semibold text-xs border border-gray-300 transition">
                    <Upload className="w-3.5 h-3.5 text-gray-600" />
                    <span>Upload Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                  <span className="text-[10px] text-gray-400">or enter image link below</span>
                </div>
                <input
                  type="text"
                  value={formImageUrl}
                  onChange={(e) => setFormImageUrl(e.target.value)}
                  placeholder="/assets/logo.png or https://..."
                  className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-brand-red font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Brief summary of items in this category"
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
                  className="bg-brand-red hover:bg-brand-red-dark text-white font-bold"
                >
                  {isSubmitting ? 'Saving...' : editingCategory ? 'Update Category' : 'Create Category'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Category Confirmation Dialog */}
      {deletingCategory && (
        <Dialog open={!!deletingCategory} onOpenChange={() => setDeletingCategory(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircle className="w-5 h-5" />
                <DialogTitle className="text-base font-bold text-gray-900">
                  Delete Category: {deletingCategory.name}
                </DialogTitle>
              </div>
              <DialogDescription className="text-xs text-gray-600 pt-2">
                Are you sure you want to permanently delete category <strong>"{deletingCategory.name}"</strong>?
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 pt-2 text-xs">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800">
                <p className="font-bold flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-amber-600" />
                  What should happen to existing products in this category?
                </p>
                <p className="text-[11px] text-amber-700 mt-1">
                  Choose a destination category for items currently assigned to this category:
                </p>

                <select
                  value={reassignTargetId}
                  onChange={(e) => setReassignTargetId(e.target.value)}
                  className="mt-2 w-full border border-amber-300 rounded p-1.5 bg-white text-gray-800 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  <option value="null">— Unlink products (Leave Uncategorized) —</option>
                  {categories
                    .filter((c) => c.id !== deletingCategory.id)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        Move products to: {c.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <DialogFooter className="flex justify-end gap-2 pt-3 border-t border-gray-100">
              <Button size="sm" variant="outline" onClick={() => setDeletingCategory(null)}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleConfirmDelete}
                disabled={isSubmitting}
                className="bg-red-600 hover:bg-red-700 text-white font-bold"
              >
                {isSubmitting ? 'Deleting...' : 'Confirm Delete Category'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
