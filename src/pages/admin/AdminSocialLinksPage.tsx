import React, { useEffect, useState, useMemo } from 'react';
import {
  Share2,
  Plus,
  ExternalLink,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Globe,
  MessageCircle,
  Video,
  Instagram,
  Facebook,
  Youtube,
  Twitter,
  Linkedin,
  Search,
  Check,
  RefreshCw,
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
import { getSocialLinks, saveSocialLinks } from '@/services/admin';
import type { SocialLink } from '@/types';
import { toast } from 'sonner';

export const AdminSocialLinksPage: React.FC = () => {
  const [links, setLinks] = useState<SocialLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [platformFilter, setPlatformFilter] = useState('all');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<SocialLink | null>(null);
  const [deletingLink, setDeletingLink] = useState<SocialLink | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [formPlatform, setFormPlatform] = useState<SocialLink['platform']>('facebook');
  const [formTitle, setFormTitle] = useState('');
  const [formUrl, setFormUrl] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);
  const [formOrder, setFormOrder] = useState('1');

  const fetchLinks = async () => {
    setLoading(true);
    try {
      const data = await getSocialLinks();
      setLinks(data);
    } catch (err: any) {
      console.error('Failed to load social links:', err);
      toast.error('Could not load links: ' + (err.message || ''));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLinks();
  }, []);

  const handleOpenAdd = () => {
    setEditingLink(null);
    setFormPlatform('facebook');
    setFormTitle('Facebook Page');
    setFormUrl('https://facebook.com/millenniumera');
    setFormIsActive(true);
    setFormOrder((links.length + 1).toString());
    setIsModalOpen(true);
  };

  const handleOpenEdit = (l: SocialLink) => {
    setEditingLink(l);
    setFormPlatform(l.platform as any);
    setFormTitle(l.title || l.platform);
    setFormUrl(l.url);
    setFormIsActive(l.is_active);
    setFormOrder((l.display_order ?? 1).toString());
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formUrl.trim()) {
      toast.error('Please enter both Title and Target URL');
      return;
    }

    setIsSubmitting(true);
    try {
      let updatedList: SocialLink[];
      const orderNum = parseInt(formOrder, 10) || 1;

      if (editingLink) {
        updatedList = links.map((item) =>
          item.id === editingLink.id
            ? {
                ...item,
                platform: formPlatform,
                title: formTitle.trim(),
                url: formUrl.trim(),
                is_active: formIsActive,
                display_order: orderNum,
                icon: formPlatform,
                updated_at: new Date().toISOString(),
              }
            : item
        );
      } else {
        const newId = `link_${Date.now()}`;
        const newLink: SocialLink = {
          id: newId,
          platform: formPlatform,
          title: formTitle.trim(),
          url: formUrl.trim(),
          is_active: formIsActive,
          display_order: orderNum,
          icon: formPlatform,
          updated_at: new Date().toISOString(),
        };
        updatedList = [...links, newLink];
      }

      await saveSocialLinks(updatedList);
      setLinks(updatedList);
      toast.success(editingLink ? 'Link updated successfully!' : 'New link added successfully!');
      setIsModalOpen(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save link');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (link: SocialLink) => {
    const updated = links.map((item) =>
      item.id === link.id ? { ...item, is_active: !item.is_active } : item
    );
    try {
      await saveSocialLinks(updated);
      setLinks(updated);
      toast.success(`"${link.title}" is now ${!link.is_active ? 'Active' : 'Inactive'}`);
    } catch (err: any) {
      toast.error('Failed to toggle status: ' + err.message);
    }
  };

  const handleDelete = async () => {
    if (!deletingLink) return;
    setIsSubmitting(true);
    try {
      const updated = links.filter((item) => item.id !== deletingLink.id);
      await saveSocialLinks(updated);
      setLinks(updated);
      toast.success(`Link "${deletingLink.title}" deleted`);
      setDeletingLink(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete link');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPlatformIcon = (platform: SocialLink['platform']) => {
    switch (platform) {
      case 'facebook':
        return <Facebook className="w-4 h-4 text-blue-600" />;
      case 'instagram':
        return <Instagram className="w-4 h-4 text-pink-600" />;
      case 'whatsapp':
        return <MessageCircle className="w-4 h-4 text-emerald-600" />;
      case 'youtube':
        return <Youtube className="w-4 h-4 text-red-600" />;
      case 'tiktok':
        return <Video className="w-4 h-4 text-gray-900" />;
      case 'twitter':
        return <Twitter className="w-4 h-4 text-sky-500" />;
      case 'linkedin':
        return <Linkedin className="w-4 h-4 text-blue-700" />;
      default:
        return <Globe className="w-4 h-4 text-amber-600" />;
    }
  };

  // Filtered list
  const filteredLinks = useMemo(() => {
    return links.filter((l) => {
      const matchesSearch =
        (l.title || l.platform).toLowerCase().includes(search.toLowerCase()) ||
        l.url.toLowerCase().includes(search.toLowerCase()) ||
        l.platform.toLowerCase().includes(search.toLowerCase());
      const matchesPlatform = platformFilter === 'all' || l.platform === platformFilter;
      return matchesSearch && matchesPlatform;
    });
  }, [links, search, platformFilter]);

  const activeCount = links.filter((l) => l.is_active).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-red-50 text-brand-red rounded-lg">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">
                Social & Custom Links
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">
                Configure your official social handles, WhatsApp chat line, and custom promotional destination links.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={fetchLinks}
            className="text-gray-600 border-gray-200 hover:bg-gray-50 text-xs h-9"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button
            size="sm"
            onClick={handleOpenAdd}
            className="bg-brand-red hover:bg-brand-red-dark text-white font-bold text-xs h-9 px-4 flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Link</span>
          </Button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs">
          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Total Links</p>
          <p className="text-2xl font-black text-gray-900 mt-1">{links.length}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs">
          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Active in Storefront</p>
          <p className="text-2xl font-black text-emerald-600 mt-1">{activeCount}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs">
          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Social Channels</p>
          <p className="text-2xl font-black text-blue-600 mt-1">
            {links.filter((l) => l.platform !== 'custom').length}
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs">
          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Custom Campaigns</p>
          <p className="text-2xl font-black text-amber-600 mt-1">
            {links.filter((l) => l.platform === 'custom').length}
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search links, handles or URLs..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-red bg-gray-50/50"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-gray-600 whitespace-nowrap">Platform:</span>
          <select
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value)}
            className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-brand-red"
          >
            <option value="all">All Platforms</option>
            <option value="facebook">Facebook</option>
            <option value="instagram">Instagram</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="youtube">YouTube</option>
            <option value="tiktok">TikTok</option>
            <option value="twitter">X (Twitter)</option>
            <option value="custom">Custom URL</option>
          </select>
        </div>
      </div>

      {/* Links Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-gray-50 text-gray-500 font-bold border-b border-gray-200 uppercase text-[10px]">
              <tr>
                <th className="p-3.5">Platform</th>
                <th className="p-3.5">Link Title</th>
                <th className="p-3.5">Target Destination</th>
                <th className="p-3.5">Display Order</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-gray-300" />
                    Loading social and store links...
                  </td>
                </tr>
              ) : filteredLinks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-400">
                    No links found matching your criteria. Click "Add New Link" above to add one.
                  </td>
                </tr>
              ) : (
                filteredLinks.map((l) => (
                  <tr key={l.id} className="hover:bg-gray-50/70 transition">
                    <td className="p-3.5">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-gray-50 border border-gray-200">
                          {getPlatformIcon(l.platform)}
                        </div>
                        <span className="font-bold text-gray-900 capitalize">{l.platform}</span>
                      </div>
                    </td>

                    <td className="p-3.5">
                      <p className="font-semibold text-gray-900">{l.title || l.platform}</p>
                    </td>

                    <td className="p-3.5">
                      <div className="flex items-center gap-1.5 max-w-xs">
                        <span className="truncate font-mono text-[11px] text-gray-600 bg-gray-50 px-2 py-0.5 rounded border border-gray-200">
                          {l.url}
                        </span>
                        <a
                          href={l.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-gray-400 hover:text-brand-red p-1 rounded hover:bg-gray-100 transition"
                          title="Open link in new tab"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </td>

                    <td className="p-3.5 font-mono text-gray-600">
                      #{l.display_order ?? 1}
                    </td>

                    <td className="p-3.5">
                      <button
                        onClick={() => handleToggleActive(l)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase transition ${
                          l.is_active
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            l.is_active ? 'bg-emerald-600' : 'bg-gray-400'
                          }`}
                        />
                        {l.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>

                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenEdit(l)}
                          className="h-7 px-2.5 text-gray-600 hover:text-brand-red hover:border-brand-red text-xs"
                        >
                          <Edit2 className="w-3.5 h-3.5 mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setDeletingLink(l)}
                          className="h-7 px-2 text-red-600 border-red-200 hover:bg-red-50 text-xs"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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

      {/* Add / Edit Dialog */}
      {isModalOpen && (
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-gray-900">
                {editingLink ? 'Edit Link' : 'Add New Link'}
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-500">
                Configure platform, visible label, and target destination URL.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSave} className="space-y-4 pt-2 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Platform / Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={formPlatform}
                  onChange={(e: any) => {
                    const val = e.target.value;
                    setFormPlatform(val);
                    if (!editingLink) {
                      if (val === 'facebook') {
                        setFormTitle('Facebook Page');
                        setFormUrl('https://facebook.com/millenniumera');
                      } else if (val === 'instagram') {
                        setFormTitle('Instagram Profile');
                        setFormUrl('https://instagram.com/millenniumera');
                      } else if (val === 'whatsapp') {
                        setFormTitle('WhatsApp VIP Support');
                        setFormUrl('https://wa.me/8801700000000');
                      } else if (val === 'youtube') {
                        setFormTitle('Official YouTube Channel');
                        setFormUrl('https://youtube.com/@millenniumera');
                      } else if (val === 'tiktok') {
                        setFormTitle('TikTok Trends');
                        setFormUrl('https://tiktok.com/@millenniumera');
                      } else if (val === 'twitter') {
                        setFormTitle('X (Twitter)');
                        setFormUrl('https://twitter.com/millenniumera');
                      } else {
                        setFormTitle('Custom Campaign Link');
                        setFormUrl('https://');
                      }
                    }
                  }}
                  className="w-full border border-gray-300 rounded-md p-2 bg-white focus:outline-none focus:ring-1 focus:ring-brand-red font-medium"
                >
                  <option value="facebook">Facebook</option>
                  <option value="instagram">Instagram</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="youtube">YouTube</option>
                  <option value="tiktok">TikTok</option>
                  <option value="twitter">X (Twitter)</option>
                  <option value="linkedin">LinkedIn</option>
                  <option value="custom">Custom Store Link / Campaign</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Link Title / Label <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Official Facebook Page"
                  className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-brand-red font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Target Destination URL <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formUrl}
                  onChange={(e) => setFormUrl(e.target.value)}
                  placeholder="https://facebook.com/yourpage or /offers"
                  className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-brand-red font-mono"
                />
                <p className="text-[10px] text-gray-400 mt-1">
                  Enter full web URL (`https://...`) or internal store path (e.g. `/shop`, `/offers`).
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
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
                  <label className="block font-semibold text-gray-700 mb-1">Storefront Status</label>
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="checkbox"
                      id="linkActiveCheck"
                      checked={formIsActive}
                      onChange={(e) => setFormIsActive(e.target.checked)}
                      className="w-4 h-4 text-brand-red rounded border-gray-300 focus:ring-brand-red cursor-pointer"
                    />
                    <label htmlFor="linkActiveCheck" className="text-xs font-semibold text-gray-700 cursor-pointer">
                      Active (Visible to Shoppers)
                    </label>
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
                  {isSubmitting ? 'Saving...' : editingLink ? 'Save Changes' : 'Create Link'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      {deletingLink && (
        <Dialog open={!!deletingLink} onOpenChange={() => setDeletingLink(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircle className="w-5 h-5" />
                <DialogTitle className="text-base font-bold text-gray-900">
                  Delete Link
                </DialogTitle>
              </div>
              <DialogDescription className="text-xs text-gray-600 pt-2">
                Are you sure you want to delete the link <strong>"{deletingLink.title || deletingLink.platform}"</strong> ({deletingLink.url})?
                This action cannot be undone.
              </DialogDescription>
            </DialogHeader>

            <DialogFooter className="flex justify-end gap-2 pt-3 border-t border-gray-100">
              <Button size="sm" variant="outline" onClick={() => setDeletingLink(null)}>
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
