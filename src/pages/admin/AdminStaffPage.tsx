import React, { useEffect, useState, useMemo } from 'react';
import {
  UserCheck,
  Crown,
  Shield,
  ShieldCheck,
  ShoppingBag,
  Boxes,
  Headphones,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  Ban,
  Lock,
  CheckSquare,
  Square,
  AlertCircle,
  Sparkles,
  Phone,
  Mail,
  User,
  X,
  RefreshCw,
  Check,
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
import { useAuth } from '@/contexts/AuthContext';
import {
  getStaffMembers,
  createStaffAdmin,
  updateStaffDesignatedTasks,
  removeStaffRole,
  updateUserAccountStatus,
} from '@/services/admin';
import { formatDate } from '@/lib/utils';
import { STAFF_TASKS, type Profile, type UserRole, type StaffTaskDefinition } from '@/types';
import { toast } from 'sonner';

// Mapping role to default task presets
const ROLE_PRESET_TASKS: Record<UserRole, string[]> = {
  super_admin: STAFF_TASKS.map((t) => t.id),
  admin: [
    'orders_fulfillment',
    'payment_verification',
    'catalog_management',
    'inventory_control',
    'customer_support',
    'marketing_promotions',
    'fraud_monitoring',
    'store_settings',
  ],
  order_manager: ['orders_fulfillment', 'payment_verification', 'customer_support'],
  inventory_manager: ['catalog_management', 'inventory_control'],
  support_agent: ['customer_support', 'orders_fulfillment'],
  customer: [],
};

const ROLE_INFO: Record<
  UserRole,
  { label: string; icon: React.ComponentType<{ className?: string }>; color: string; badge: string }
> = {
  super_admin: {
    label: 'Super Admin',
    icon: Crown,
    color: 'text-amber-500',
    badge: 'bg-gradient-to-r from-amber-500/10 via-yellow-500/15 to-amber-500/10 border-amber-500/30 text-amber-600',
  },
  admin: {
    label: 'Store Admin',
    icon: ShieldCheck,
    color: 'text-brand-red',
    badge: 'bg-red-50 border-red-200 text-brand-red',
  },
  order_manager: {
    label: 'Order Manager',
    icon: ShoppingBag,
    color: 'text-blue-600',
    badge: 'bg-blue-50 border-blue-200 text-blue-700',
  },
  inventory_manager: {
    label: 'Inventory Manager',
    icon: Boxes,
    color: 'text-emerald-600',
    badge: 'bg-emerald-50 border-emerald-200 text-emerald-700',
  },
  support_agent: {
    label: 'Support Agent',
    icon: Headphones,
    color: 'text-purple-600',
    badge: 'bg-purple-50 border-purple-200 text-purple-700',
  },
  customer: {
    label: 'Customer',
    icon: User,
    color: 'text-gray-500',
    badge: 'bg-gray-100 border-gray-200 text-gray-600',
  },
};

export const AdminStaffPage: React.FC = () => {
  const { user: currentUser, isSuperAdmin } = useAuth();
  const [staff, setStaff] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Profile | null>(null);
  const [revokingStaff, setRevokingStaff] = useState<Profile | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states for Add Staff
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newPassword, setNewPassword] = useState('MillenniumAdmin2026!');
  const [newRole, setNewRole] = useState<UserRole>('admin');
  const [newSelectedTasks, setNewSelectedTasks] = useState<string[]>(ROLE_PRESET_TASKS['admin']);

  // Form states for Edit Staff
  const [editRole, setEditRole] = useState<UserRole>('admin');
  const [editSelectedTasks, setEditSelectedTasks] = useState<string[]>([]);
  const [editStatus, setEditStatus] = useState<'active' | 'suspended'>('active');

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const data = await getStaffMembers();
      setStaff(data);
    } catch (err: any) {
      console.error('Error fetching staff:', err);
      toast.error('Failed to load staff list: ' + (err.message || 'Check database connection'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  // Update tasks when role changes in Add modal
  const handleRoleChangeForNew = (role: UserRole) => {
    setNewRole(role);
    setNewSelectedTasks(ROLE_PRESET_TASKS[role] || []);
  };

  // Toggle single task in Add modal
  const toggleTaskForNew = (taskId: string) => {
    setNewSelectedTasks((prev) =>
      prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]
    );
  };

  // Toggle single task in Edit modal
  const toggleTaskForEdit = (taskId: string) => {
    setEditSelectedTasks((prev) =>
      prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]
    );
  };

  // Select all / Deselect all
  const selectAllTasksForNew = () => setNewSelectedTasks(STAFF_TASKS.map((t) => t.id));
  const deselectAllTasksForNew = () => setNewSelectedTasks([]);
  const selectAllTasksForEdit = () => setEditSelectedTasks(STAFF_TASKS.map((t) => t.id));
  const deselectAllTasksForEdit = () => setEditSelectedTasks([]);

  // Compute permissions from selected tasks
  const computePermissions = (taskIds: string[], role: UserRole): string[] => {
    if (role === 'super_admin') return ['*'];
    const perms = new Set<string>();
    taskIds.forEach((taskId) => {
      const taskDef = STAFF_TASKS.find((t) => t.id === taskId);
      taskDef?.permissions.forEach((p) => perms.add(p));
    });
    return Array.from(perms);
  };

  // Handle Add Staff submission
  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) {
      toast.error('Email is required');
      return;
    }
    if (!newName.trim()) {
      toast.error('Full name is required');
      return;
    }
    if (newPassword.trim() && newPassword.trim().length < 6) {
      toast.error('Initial password must be at least 6 characters');
      return;
    }

    setIsSubmitting(true);
    try {
      const permissions = computePermissions(newSelectedTasks, newRole);
      await createStaffAdmin({
        email: newEmail.trim(),
        full_name: newName.trim(),
        phone: newPhone.trim() || undefined,
        password: newPassword.trim() || undefined,
        role: newRole,
        assigned_tasks: newSelectedTasks,
        permissions,
      });

      toast.success(`Administrator ${newName} successfully created/assigned!`);
      setIsAddModalOpen(false);
      // Reset form
      setNewEmail('');
      setNewName('');
      setNewPhone('');
      setNewPassword('MillenniumAdmin2026!');
      setNewRole('admin');
      setNewSelectedTasks(ROLE_PRESET_TASKS['admin']);
      fetchStaff();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create administrator');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Edit modal
  const handleOpenEdit = (member: Profile) => {
    setEditingStaff(member);
    setEditRole(member.role);
    setEditSelectedTasks(member.assigned_tasks || ROLE_PRESET_TASKS[member.role] || []);
    setEditStatus(member.account_status === 'suspended' ? 'suspended' : 'active');
  };

  // Handle Edit Staff submission
  const handleUpdateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff) return;

    setIsSubmitting(true);
    try {
      const permissions = computePermissions(editSelectedTasks, editRole);
      await updateStaffDesignatedTasks(editingStaff.id, {
        role: editRole,
        assigned_tasks: editSelectedTasks,
        permissions,
        account_status: editStatus,
      });

      toast.success(`Duties updated for ${editingStaff.full_name || editingStaff.email}!`);
      setEditingStaff(null);
      fetchStaff();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update designated tasks');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Revoke Role
  const handleConfirmRevoke = async () => {
    if (!revokingStaff) return;
    setIsSubmitting(true);
    try {
      await removeStaffRole(revokingStaff.id);
      toast.info(`Staff privileges revoked for ${revokingStaff.full_name || revokingStaff.email}`);
      setRevokingStaff(null);
      fetchStaff();
    } catch (err: any) {
      toast.error(err.message || 'Failed to revoke staff role');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered staff list
  const filteredStaff = useMemo(() => {
    return staff.filter((m) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        m.full_name?.toLowerCase().includes(q) ||
        m.email?.toLowerCase().includes(q) ||
        m.phone?.toLowerCase().includes(q);

      const matchesRole = roleFilter === 'all' || m.role === roleFilter;
      const matchesStatus = statusFilter === 'all' || m.account_status === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [staff, search, roleFilter, statusFilter]);

  // KPI Calculations
  const totalStaff = staff.length;
  const superAdminsCount = staff.filter((s) => s.role === 'super_admin').length;
  const departmentAdminsCount = staff.filter((s) => s.role !== 'super_admin' && s.role !== 'customer').length;
  const totalDelegatedTasksCount = staff.reduce(
    (acc, cur) => acc + (cur.assigned_tasks?.length || 0),
    0
  );

  // Group tasks by category for modal display
  const tasksByCategory = useMemo(() => {
    const map: Record<string, StaffTaskDefinition[]> = {};
    STAFF_TASKS.forEach((t) => {
      if (!map[t.category]) map[t.category] = [];
      map[t.category].push(t);
    });
    return map;
  }, []);

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-brand-charcoal text-brand-gold flex items-center justify-center shadow-sm">
              <Crown className="w-5 h-5 text-brand-gold" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                <span>Staff & Role Delegation</span>
                <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand-gold/15 text-amber-700 border border-brand-gold/30">
                  Access Control
                </span>
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">
                Create sub-administrators, designate operational duties (fulfillment, bKash, stock, fraud), and monitor staff privileges.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchStaff}
            className="text-xs border-gray-300 hover:bg-gray-50 text-gray-700"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          {isSuperAdmin && (
            <Button
              onClick={() => setIsAddModalOpen(true)}
              className="bg-brand-red hover:bg-red-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 px-4"
            >
              <Plus className="w-4 h-4" />
              <span>Add Administrator</span>
            </Button>
          )}
        </div>
      </div>

      {/* 2. KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Staff */}
        <div className="bg-white rounded-xl p-5 border border-gray-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gray-100 text-brand-charcoal flex items-center justify-center flex-shrink-0">
            <UserCheck className="w-6 h-6 text-gray-700" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Staff Members</p>
            <p className="text-2xl font-black text-gray-900 mt-0.5">{totalStaff}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">Active personnel in store portal</p>
          </div>
        </div>

        {/* Super Admins */}
        <div className="bg-gradient-to-br from-amber-500/5 via-white to-yellow-500/10 rounded-xl p-5 border border-amber-300/60 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/15 text-amber-600 flex items-center justify-center flex-shrink-0 border border-amber-500/30">
            <Crown className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Super Admins</p>
            <p className="text-2xl font-black text-gray-900 mt-0.5">{superAdminsCount}</p>
            <p className="text-[11px] text-amber-700/80 mt-0.5">Full unrestricted system control</p>
          </div>
        </div>

        {/* Department Admins */}
        <div className="bg-white rounded-xl p-5 border border-gray-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 border border-blue-100">
            <ShieldCheck className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Department Managers</p>
            <p className="text-2xl font-black text-gray-900 mt-0.5">{departmentAdminsCount}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">Order, stock & support leads</p>
          </div>
        </div>

        {/* Delegated Duties */}
        <div className="bg-white rounded-xl p-5 border border-gray-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 border border-emerald-100">
            <CheckSquare className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Active Delegated Tasks</p>
            <p className="text-2xl font-black text-gray-900 mt-0.5">{totalDelegatedTasksCount}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">Assigned duties across staff</p>
          </div>
        </div>
      </div>

      {/* 3. Search & Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Search staff by name, email, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs bg-gray-50 border border-gray-300 rounded-lg pl-9 pr-4 py-2 focus:outline-none focus:ring-1 focus:ring-brand-red focus:bg-white transition"
          />
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          {/* Role Filter */}
          <div className="flex items-center gap-1.5 w-full md:w-auto">
            <span className="text-xs font-semibold text-gray-500 hidden sm:inline">Role:</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="text-xs bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-brand-red"
            >
              <option value="all">All Roles</option>
              <option value="super_admin">Super Admin</option>
              <option value="admin">Store Admin</option>
              <option value="order_manager">Order Manager</option>
              <option value="inventory_manager">Inventory Manager</option>
              <option value="support_agent">Support Agent</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 w-full md:w-auto">
            <span className="text-xs font-semibold text-gray-500 hidden sm:inline">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-brand-red"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. Staff Members Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Staff Member</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Designated Duties & Tasks</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Added On</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-brand-red mb-2" />
                    <span>Loading staff directory...</span>
                  </td>
                </tr>
              ) : filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    <UserCheck className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                    <p className="text-sm font-semibold text-gray-700">No staff members found</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {search || roleFilter !== 'all' || statusFilter !== 'all'
                        ? 'Try clearing filters or search keywords.'
                        : 'Click "Add Administrator" to create your first sub-admin.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredStaff.map((member) => {
                  const roleMeta = ROLE_INFO[member.role] || ROLE_INFO.customer;
                  const RoleIcon = roleMeta.icon;
                  const isSelf = member.id === currentUser?.id;
                  const assignedTasks = member.assigned_tasks || [];
                  const isSuper = member.role === 'super_admin';

                  return (
                    <tr key={member.id} className="hover:bg-gray-50/70 transition-colors">
                      {/* Name & Contact */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-xs flex-shrink-0 ${
                              isSuper
                                ? 'bg-brand-charcoal text-brand-gold border-2 border-brand-gold/40'
                                : 'bg-gray-100 text-gray-700 border border-gray-200'
                            }`}
                          >
                            {member.full_name?.charAt(0).toUpperCase() || member.email?.charAt(0).toUpperCase() || 'A'}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-gray-900 text-xs">
                                {member.full_name || 'Unnamed Staff'}
                              </span>
                              {isSelf && (
                                <span className="bg-brand-red/10 text-brand-red text-[10px] font-bold px-1.5 py-0.2 rounded border border-brand-red/20">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-gray-400 text-[11px] mt-0.5">
                              <span className="flex items-center gap-1">
                                <Mail className="w-3 h-3 text-gray-400" />
                                {member.email}
                              </span>
                              {member.phone && (
                                <span className="flex items-center gap-1 text-gray-400 border-l border-gray-200 pl-2">
                                  <Phone className="w-3 h-3 text-gray-400" />
                                  {member.phone}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-md border ${roleMeta.badge}`}
                        >
                          <RoleIcon className={`w-3.5 h-3.5 ${roleMeta.color}`} />
                          <span>{roleMeta.label}</span>
                        </span>
                      </td>

                      {/* Designated Duties & Tasks */}
                      <td className="py-3.5 px-4 max-w-xs">
                        {isSuper ? (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                            <Sparkles className="w-3 h-3 text-amber-500" />
                            Full Store Control (All Duties)
                          </span>
                        ) : assignedTasks.length === 0 ? (
                          <span className="text-gray-400 italic text-[11px]">No specific tasks assigned</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {assignedTasks.slice(0, 3).map((taskId) => {
                              const tDef = STAFF_TASKS.find((t) => t.id === taskId);
                              return (
                                <span
                                  key={taskId}
                                  className="inline-flex items-center gap-1 text-[10px] font-semibold bg-gray-100 text-gray-700 px-2 py-0.5 rounded border border-gray-200"
                                >
                                  <Check className="w-2.5 h-2.5 text-emerald-600" />
                                  {tDef?.name.split('&')[0] || taskId}
                                </span>
                              );
                            })}
                            {assignedTasks.length > 3 && (
                              <span className="text-[10px] font-bold bg-gray-200/80 text-gray-600 px-1.5 py-0.5 rounded">
                                +{assignedTasks.length - 3} more
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {member.account_status === 'active' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-700 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                            <Ban className="w-3 h-3 text-red-600" />
                            Suspended
                          </span>
                        )}
                      </td>

                      {/* Added On */}
                      <td className="py-3.5 px-4 text-gray-500 font-medium">
                        {formatDate(member.created_at)}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isSuperAdmin && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenEdit(member)}
                                className="h-7 text-[11px] px-2.5 font-semibold text-gray-700 border-gray-300 hover:bg-gray-100 flex items-center gap-1"
                              >
                                <Edit2 className="w-3 h-3 text-blue-600" />
                                <span>Designate Tasks</span>
                              </Button>

                              {!isSelf && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setRevokingStaff(member)}
                                  className="h-7 text-[11px] px-2 text-gray-400 hover:text-brand-red hover:bg-red-50"
                                  title="Revoke staff role"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              )}
                            </>
                          )}
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
      {/* MODAL 1: ADD NEW ADMINISTRATOR & DESIGNATE DUTIES */}
      {/* ============================================================ */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-red-50 text-brand-red flex items-center justify-center">
                <Crown className="w-4 h-4 text-brand-red" />
              </div>
              <div>
                <DialogTitle className="text-lg font-black text-gray-900">
                  Add New Administrator & Designate Duties
                </DialogTitle>
                <DialogDescription className="text-xs text-gray-500">
                  Super Admin can create a sub-admin and assign specific operational tasks across the store.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleCreateStaff} className="space-y-5 pt-2">
            {/* Identity Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  Full Name <span className="text-brand-red">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahat Islam"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full text-xs bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-brand-red focus:bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  Email Address <span className="text-brand-red">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. rahat@millenniumera.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full text-xs bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-brand-red focus:bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Phone Number (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. 01712345678"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="w-full text-xs bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-brand-red focus:bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  Initial Password <span className="text-brand-red">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full text-xs bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-brand-red focus:bg-white font-mono"
                />
              </div>
            </div>

            {/* Role Selection */}
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1.5">
                Staff Department / Role Tier
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {(['admin', 'order_manager', 'inventory_manager', 'support_agent', 'super_admin'] as UserRole[]).map(
                  (roleKey) => {
                    const meta = ROLE_INFO[roleKey];
                    const Icon = meta.icon;
                    const isSelected = newRole === roleKey;
                    return (
                      <button
                        key={roleKey}
                        type="button"
                        onClick={() => handleRoleChangeForNew(roleKey)}
                        className={`p-2.5 rounded-lg border text-left flex items-start gap-2 transition ${
                          isSelected
                            ? 'border-brand-red bg-red-50/50 shadow-sm'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <Icon className={`w-4 h-4 mt-0.5 ${meta.color}`} />
                        <div>
                          <p className="text-xs font-bold text-gray-900 leading-tight">{meta.label}</p>
                          <p className="text-[10px] text-gray-500 mt-0.5 capitalize">
                            {roleKey.replace('_', ' ')}
                          </p>
                        </div>
                      </button>
                    );
                  }
                )}
              </div>
            </div>

            {/* Granular Task Delegation Section */}
            <div className="border border-gray-200 rounded-xl p-4 bg-gray-50/50 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckSquare className="w-4 h-4 text-brand-red" />
                    <span>Designate Specific Tasks ({newSelectedTasks.length}/{STAFF_TASKS.length} Selected)</span>
                  </h4>
                  <p className="text-[11px] text-gray-500">
                    Check the specific operational responsibilities this administrator will manage.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={selectAllTasksForNew}
                    className="text-[10px] font-bold text-brand-red hover:underline"
                  >
                    Select All
                  </button>
                  <span className="text-gray-300">|</span>
                  <button
                    type="button"
                    onClick={deselectAllTasksForNew}
                    className="text-[10px] font-bold text-gray-500 hover:underline"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              {/* Tasks Grouped by Category */}
              <div className="space-y-3.5">
                {Object.entries(tasksByCategory).map(([category, tasks]) => (
                  <div key={category} className="space-y-1.5">
                    <p className="text-[11px] font-bold text-gray-700 uppercase tracking-wider bg-gray-200/60 px-2 py-0.5 rounded">
                      {category}
                    </p>
                    <div className="grid grid-cols-1 gap-1.5">
                      {tasks.map((task) => {
                        const checked = newSelectedTasks.includes(task.id);
                        return (
                          <div
                            key={task.id}
                            onClick={() => toggleTaskForNew(task.id)}
                            className={`p-2.5 rounded-lg border cursor-pointer transition flex items-start gap-2.5 ${
                              checked
                                ? 'bg-white border-brand-red/50 shadow-xs'
                                : 'bg-white/60 border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => {}} // handled by parent onClick
                              className="mt-0.5 text-brand-red rounded border-gray-300 focus:ring-brand-red"
                            />
                            <div className="flex-1">
                              <p className="text-xs font-bold text-gray-900 leading-tight">
                                {task.name}
                              </p>
                              <p className="text-[11px] text-gray-500 mt-0.5">
                                {task.description}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAddModalOpen(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting}
                className="bg-brand-red hover:bg-red-700 text-white font-bold text-xs"
              >
                {isSubmitting ? 'Creating Administrator...' : 'Create & Delegate Duties'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ============================================================ */}
      {/* MODAL 2: EDIT DUTIES & DESIGNATE TASKS FOR EXISTING ADMIN */}
      {/* ============================================================ */}
      <Dialog open={!!editingStaff} onOpenChange={(open) => !open && setEditingStaff(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Edit2 className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <DialogTitle className="text-lg font-black text-gray-900">
                  Designate Tasks for {editingStaff?.full_name || editingStaff?.email}
                </DialogTitle>
                <DialogDescription className="text-xs text-gray-500">
                  Update role privileges, assigned operational modules, and account status.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleUpdateStaff} className="space-y-5 pt-2">
            {/* Role & Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Assigned Role</label>
                <select
                  value={editRole}
                  onChange={(e) => {
                    const r = e.target.value as UserRole;
                    setEditRole(r);
                    if (r === 'super_admin') {
                      setEditSelectedTasks(STAFF_TASKS.map((t) => t.id));
                    }
                  }}
                  className="w-full text-xs bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-brand-red"
                >
                  <option value="admin">Store Admin</option>
                  <option value="order_manager">Order Manager</option>
                  <option value="inventory_manager">Inventory Manager</option>
                  <option value="support_agent">Support Agent</option>
                  <option value="super_admin">Super Admin (All Access)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Account Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as any)}
                  className="w-full text-xs bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-brand-red"
                >
                  <option value="active">Active (Permitted)</option>
                  <option value="suspended">Suspended (Blocked)</option>
                </select>
              </div>
            </div>

            {/* Granular Task Delegation Section */}
            <div className="border border-gray-200 rounded-xl p-4 bg-gray-50/50 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckSquare className="w-4 h-4 text-blue-600" />
                    <span>Designated Operational Tasks ({editSelectedTasks.length}/{STAFF_TASKS.length})</span>
                  </h4>
                  <p className="text-[11px] text-gray-500">
                    Modifications will take effect on next API request or page refresh.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={selectAllTasksForEdit}
                    className="text-[10px] font-bold text-blue-600 hover:underline"
                  >
                    Select All
                  </button>
                  <span className="text-gray-300">|</span>
                  <button
                    type="button"
                    onClick={deselectAllTasksForEdit}
                    className="text-[10px] font-bold text-gray-500 hover:underline"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              {/* Tasks Grouped by Category */}
              <div className="space-y-3.5">
                {Object.entries(tasksByCategory).map(([category, tasks]) => (
                  <div key={category} className="space-y-1.5">
                    <p className="text-[11px] font-bold text-gray-700 uppercase tracking-wider bg-gray-200/60 px-2 py-0.5 rounded">
                      {category}
                    </p>
                    <div className="grid grid-cols-1 gap-1.5">
                      {tasks.map((task) => {
                        const checked = editSelectedTasks.includes(task.id);
                        return (
                          <div
                            key={task.id}
                            onClick={() => toggleTaskForEdit(task.id)}
                            className={`p-2.5 rounded-lg border cursor-pointer transition flex items-start gap-2.5 ${
                              checked
                                ? 'bg-white border-blue-500/50 shadow-xs'
                                : 'bg-white/60 border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => {}} // handled by parent onClick
                              className="mt-0.5 text-blue-600 rounded border-gray-300 focus:ring-blue-600"
                            />
                            <div className="flex-1">
                              <p className="text-xs font-bold text-gray-900 leading-tight">
                                {task.name}
                              </p>
                              <p className="text-[11px] text-gray-500 mt-0.5">
                                {task.description}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEditingStaff(null)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
              >
                {isSubmitting ? 'Saving...' : 'Save Designated Duties'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ============================================================ */}
      {/* MODAL 3: CONFIRM REVOKE STAFF PRIVILEGES */}
      {/* ============================================================ */}
      <Dialog open={!!revokingStaff} onOpenChange={(open) => !open && setRevokingStaff(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-red-50 text-brand-red flex items-center justify-center">
                <AlertCircle className="w-4 h-4 text-brand-red" />
              </div>
              <DialogTitle className="text-base font-black text-gray-900">
                Revoke Administrative Privileges?
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-gray-500 pt-2">
              Are you sure you want to revoke administrative access for{' '}
              <strong className="text-gray-800">{revokingStaff?.full_name || revokingStaff?.email}</strong>?
              Their role will be downgraded to a standard customer account and all delegated duties will be removed.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="pt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRevokingStaff(null)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={isSubmitting}
              onClick={handleConfirmRevoke}
              className="text-xs font-bold"
            >
              {isSubmitting ? 'Revoking...' : 'Revoke Privileges'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
