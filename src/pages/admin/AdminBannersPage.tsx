import React, { useEffect, useState } from 'react';
import { Image as ImageIcon, Plus, Trash2, Edit2, Upload, ExternalLink, Link2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { getAdminBanners, createBanner, updateBanner, deleteBanner } from '@/services/admin';
import type { Banner } from '@/types';
import { toast } from 'sonner';

const LINK_PRESETS = [
  { label: 'All Products', url: '/shop' },
  { label: 'Special Offers', url: '/offers' },
  { label: 'Fashion', url: '/category/fashion' },
  { label: 'Electronics', url: '/category/electronics' },
  { label: 'Accessories', url: '/category/accessories' },
  { label: 'Books & Stationery', url: '/category/books-stationery' },
  { label: 'Home & Living', url: '/category/home-living' },
  { label: 'Beauty & Health', url: '/category/beauty-health' },
  { label: 'Sports & Fitness', url: '/category/sports-fitness' },
  { label: 'Toys & Games', url: '/category/toys-games' },
];

export const AdminBannersPage: React.FC = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [deletingBanner, setDeletingBanner] = useState<Banner | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formTitle, setFormTitle] = useState('');
  const [formSubtitle, setFormSubtitle] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('/assets/logo.png');
  const [formCtaText, setFormCtaText] = useState('Shop Now');
  const [formCtaUrl, setFormCtaUrl] = useState('/shop');
  const [formStatus, setFormStatus] = useState<'active' | 'inactive'>('active');

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const data = await getAdminBanners();
      setBanners(data);
    } catch (err) {
      console.error('Error fetching banners:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const handleOpenAdd = () => {
    setEditingBanner(null);
    setFormTitle('');
    setFormSubtitle('');
    setFormImageUrl('/assets/logo.png');
    setFormCtaText('Shop Now');
    setFormCtaUrl('/shop');
    setFormStatus('active');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (b: Banner) => {
    setEditingBanner(b);
    setFormTitle(b.title);
    setFormSubtitle(b.subtitle || '');
    setFormImageUrl(b.image_url || '/assets/logo.png');
    setFormCtaText(b.cta_text);
    setFormCtaUrl(b.cta_url);
    setFormStatus(b.status === 'active' ? 'active' : 'inactive');
    setIsModalOpen(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please choose a valid image file');
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
      toast.success('Banner image loaded!');
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      toast.error('Headline is required');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingBanner) {
        await updateBanner(editingBanner.id, {
          title: formTitle.trim(),
          subtitle: formSubtitle.trim() || null,
          image_url: formImageUrl.trim(),
          cta_text: formCtaText.trim() || 'Shop Now',
          cta_url: formCtaUrl.trim() || '/shop',
          status: formStatus,
        });
        toast.success('Banner updated successfully');
      } else {
        await createBanner({
          title: formTitle.trim(),
          subtitle: formSubtitle.trim() || null,
          image_url: formImageUrl.trim(),
          cta_text: formCtaText.trim() || 'Shop Now',
          cta_url: formCtaUrl.trim() || '/shop',
          display_order: banners.length + 1,
          status: formStatus,
        });
        toast.success('New banner created');
      }
      setIsModalOpen(false);
      fetchBanners();
    } catch (err: any) {
      toast.error(err.message || 'Action failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingBanner) return;
    setIsSubmitting(true);
    try {
      await deleteBanner(deletingBanner.id);
      toast.info('Banner removed');
      setDeletingBanner(null);
      fetchBanners();
    } catch (err: any) {
      toast.error(err.message || 'Delete failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">
            Homepage Hero Banners
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Add promotional carousels, edit banner text, and configure button destination links.
          </p>
        </div>

        <Button
          onClick={handleOpenAdd}
          className="bg-brand-red hover:bg-brand-red-dark text-white text-xs font-bold px-4 h-9 flex items-center gap-1.5 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Add Banner</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {banners.map((b) => (
          <div
            key={b.id}
            className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm flex flex-col justify-between"
          >
            <div className="h-44 bg-neutral-900 p-4 flex items-center justify-center relative overflow-hidden">
              <img
                src={b.image_url || '/assets/logo.png'}
                alt={b.title}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = '/assets/logo.png';
                }}
                className="max-h-full max-w-full object-contain"
              />
              <span
                className={`absolute top-3 right-3 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  b.status === 'active'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {b.status}
              </span>
            </div>

            <div className="p-4 space-y-2">
              <h3 className="text-base font-bold text-gray-900">{b.title}</h3>
              {b.subtitle && <p className="text-xs text-gray-500">{b.subtitle}</p>}
              <div className="flex items-center gap-1.5 text-[11px] text-gray-600 font-mono bg-gray-50 p-2 rounded border border-gray-200">
                <Link2 className="w-3.5 h-3.5 text-brand-red" />
                <span className="font-bold text-gray-900">{b.cta_text}:</span>
                <span className="truncate">{b.cta_url}</span>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-gray-100">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleOpenEdit(b)}
                  className="text-gray-700 hover:text-brand-red text-xs h-7 px-3"
                >
                  <Edit2 className="w-3.5 h-3.5 mr-1" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setDeletingBanner(b)}
                  className="text-red-600 border-red-200 hover:bg-red-50 text-xs h-7 px-3"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1" />
                  Delete
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-gray-900">
                {editingBanner ? 'Edit Hero Banner' : 'New Hero Slide'}
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-500">
                Customize the banner headline, image, and destination link for shoppers.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSave} className="space-y-4 pt-2 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Headline <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Winter Luxury Arrivals"
                  className="w-full border border-gray-300 rounded-md p-2 focus:ring-1 focus:ring-brand-red font-semibold"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Subtitle</label>
                <input
                  type="text"
                  value={formSubtitle}
                  onChange={(e) => setFormSubtitle(e.target.value)}
                  placeholder="e.g. Up to 40% Off Selected Timepieces"
                  className="w-full border border-gray-300 rounded-md p-2 focus:ring-1 focus:ring-brand-red"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Banner Image</label>
                <div className="flex items-center gap-2 mb-1.5">
                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md font-semibold text-xs border border-gray-300 transition">
                    <Upload className="w-3.5 h-3.5 text-gray-600" />
                    <span>Upload Banner Image</span>
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
                  className="w-full border border-gray-300 rounded-md p-2 focus:ring-1 focus:ring-brand-red font-mono"
                />
                {formImageUrl && (
                  <div className="mt-2 p-2 bg-gray-50 border border-gray-200 rounded-lg flex items-center gap-2">
                    <img
                      src={formImageUrl}
                      alt="Banner preview"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = '/assets/logo.png';
                      }}
                      className="h-10 w-20 object-cover rounded bg-neutral-900 border"
                    />
                    <span className="text-[11px] text-gray-500 font-mono truncate">Preview loaded</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Button Text</label>
                  <input
                    type="text"
                    value={formCtaText}
                    onChange={(e) => setFormCtaText(e.target.value)}
                    placeholder="Shop Now"
                    className="w-full border border-gray-300 rounded-md p-2 focus:ring-1 focus:ring-brand-red font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Status</label>
                  <select
                    value={formStatus}
                    onChange={(e: any) => setFormStatus(e.target.value)}
                    className="w-full border border-gray-300 rounded-md p-2 bg-white focus:ring-1 focus:ring-brand-red font-semibold"
                  >
                    <option value="active">Active (Visible)</option>
                    <option value="inactive">Inactive (Hidden)</option>
                  </select>
                </div>
              </div>

              {/* Destination Link with Presets */}
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Destination Link (Where button takes shopper) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={formCtaUrl}
                    onChange={(e) => setFormCtaUrl(e.target.value)}
                    placeholder="/shop, /offers, /category/fashion, or https://..."
                    className="w-full border border-gray-300 rounded-md p-2 focus:ring-1 focus:ring-brand-red font-mono font-medium"
                  />
                </div>

                <div className="mt-2">
                  <p className="text-[11px] font-semibold text-gray-500 mb-1.5 flex items-center gap-1">
                    <Link2 className="w-3 h-3 text-brand-red" />
                    <span>Quick Link Options (Click to select):</span>
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {LINK_PRESETS.map((p) => (
                      <button
                        key={p.url}
                        type="button"
                        onClick={() => setFormCtaUrl(p.url)}
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold border transition ${
                          formCtaUrl === p.url
                            ? 'bg-brand-red text-white border-brand-red'
                            : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100 hover:border-gray-300'
                        }`}
                      >
                        {p.label} ({p.url})
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <DialogFooter className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <Button size="sm" variant="outline" type="button" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-brand-red hover:bg-brand-red-dark text-white font-bold"
                >
                  {isSubmitting ? 'Saving...' : editingBanner ? 'Save Changes' : 'Publish Banner'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      {deletingBanner && (
        <Dialog open={!!deletingBanner} onOpenChange={() => setDeletingBanner(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircle className="w-5 h-5" />
                <DialogTitle className="text-base font-bold text-gray-900">
                  Delete Hero Banner
                </DialogTitle>
              </div>
              <DialogDescription className="text-xs text-gray-600 pt-2">
                Are you sure you want to remove <strong>"{deletingBanner.title}"</strong>?
                This banner will no longer appear in the homepage slider.
              </DialogDescription>
            </DialogHeader>

            <DialogFooter className="flex justify-end gap-2 pt-3 border-t border-gray-100">
              <Button size="sm" variant="outline" onClick={() => setDeletingBanner(null)}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleDelete}
                disabled={isSubmitting}
                className="bg-red-600 hover:bg-red-700 text-white font-bold"
              >
                {isSubmitting ? 'Deleting...' : 'Confirm Delete'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
