import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { parseApiError } from '@/lib/api-error';
import { Users, UserCheck, ShieldCheck, DollarSign, Search } from 'lucide-react';
import AdminSidebar from '@/components/pos/AdminSidebar';
import ConfirmDeleteDialog from '@/components/pos/ConfirmDeleteDialog';

interface Employee {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'employee';
  phone: string;
  position: string;
  pin: string;
  isActive: boolean;
  ordersCount: number;
  totalRevenue: number;
}

const POSITIONS = ['Cashier', 'Waiter / Server', 'Manager', 'Kitchen Staff', 'Supervisor'];

const AdminEmployees = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000';
  const queryClient = useQueryClient();

  const { data: employees, isLoading } = useQuery<Employee[]>({
    queryKey: ['employees'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/api/employees`);
      if (!res.ok) throw new Error('Failed to load employees');
      return res.json();
    },
  });

  const [editingEmployeeId, setEditingEmployeeId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);
  const [search, setSearch] = useState('');

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'employee' as 'admin' | 'employee',
    phone: '',
    position: 'Cashier',
    pin: '',
    isActive: true,
  });

  const resetForm = () => {
    setEditingEmployeeId(null);
    setForm({
      name: '',
      email: '',
      password: '',
      role: 'employee',
      phone: '',
      position: 'Cashier',
      pin: '',
      isActive: true,
    });
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editingEmployeeId) {
        const res = await fetch(`${API_BASE_URL}/api/employees/${editingEmployeeId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: form.name.trim(),
            email: form.email.trim(),
            password: form.password || null,
            role: form.role,
            phone: form.phone.trim() || null,
            position: form.position,
            pin: form.pin.trim() || null,
            isActive: form.isActive,
          }),
        });
        if (!res.ok) {
          throw new Error(await parseApiError(res, 'Failed to update employee'));
        }
      } else {
        const res = await fetch(`${API_BASE_URL}/api/employees`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: form.name.trim(),
            email: form.email.trim(),
            password: form.password,
            role: form.role,
            phone: form.phone.trim() || null,
            position: form.position,
            pin: form.pin.trim() || null,
            isActive: form.isActive,
          }),
        });
        if (!res.ok) {
          throw new Error(await parseApiError(res, 'Failed to create employee'));
        }
      }
    },
    onSuccess: () => {
      toast.success(editingEmployeeId ? 'Employee updated successfully' : 'Employee created successfully');
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to save employee');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`${API_BASE_URL}/api/employees/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        throw new Error(await parseApiError(res, 'Failed to delete employee'));
      }
    },
    onSuccess: () => {
      toast.success('Employee deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setDeleteTarget(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete employee');
      setDeleteTarget(null);
    },
  });

  const handleEdit = (emp: Employee) => {
    setEditingEmployeeId(emp.id);
    setForm({
      name: emp.name,
      email: emp.email,
      password: '',
      role: emp.role,
      phone: emp.phone || '',
      position: emp.position || 'Cashier',
      pin: emp.pin || '',
      isActive: emp.isActive,
    });
  };

  const filteredEmployees = (employees ?? []).filter(emp => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      emp.name.toLowerCase().includes(q) ||
      emp.email.toLowerCase().includes(q) ||
      emp.position.toLowerCase().includes(q)
    );
  });

  const totalStaff = employees?.length ?? 0;
  const activeStaff = employees?.filter(e => e.isActive).length ?? 0;
  const adminCount = employees?.filter(e => e.role === 'admin').length ?? 0;
  const totalRevenue = employees?.reduce((sum, e) => sum + e.totalRevenue, 0) ?? 0;

  return (
    <AdminSidebar>
      <div className="p-8 space-y-8">
        <div>
          <h1 className="text-2xl font-bold mb-1">Employees</h1>
          <p className="text-sm text-muted-foreground">Manage staff accounts, roles, PINs, and sales performance</p>
        </div>

        {/* Summary KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-card rounded-2xl border p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Staff</p>
              <p className="text-2xl font-bold">{totalStaff}</p>
            </div>
          </div>

          <div className="bg-card rounded-2xl border p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Active Accounts</p>
              <p className="text-2xl font-bold">{activeStaff}</p>
            </div>
          </div>

          <div className="bg-card rounded-2xl border p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Admins / Managers</p>
              <p className="text-2xl font-bold">{adminCount}</p>
            </div>
          </div>

          <div className="bg-card rounded-2xl border p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Staff Revenue</p>
              <p className="text-2xl font-bold">₨{totalRevenue.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="bg-card rounded-2xl border p-6 space-y-4 h-fit">
            <h2 className="font-semibold text-lg">{editingEmployeeId ? 'Edit Employee' : 'Add Employee'}</h2>
            <div className="space-y-3">
              <input
                className="w-full h-10 rounded-md border px-3 text-sm bg-background"
                placeholder="Full name (e.g. Ali Khan)"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              />
              <input
                className="w-full h-10 rounded-md border px-3 text-sm bg-background"
                placeholder="Email (e.g. ali@syrpos.com)"
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              />
              <input
                className="w-full h-10 rounded-md border px-3 text-sm bg-background"
                placeholder={editingEmployeeId ? 'New password (leave blank to keep)' : 'Password'}
                type="password"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              />
              <input
                className="w-full h-10 rounded-md border px-3 text-sm bg-background"
                placeholder="Phone number (optional)"
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              />
              <div className="grid grid-cols-2 gap-3">
                <select
                  className="w-full h-10 rounded-md border px-3 text-sm bg-background"
                  value={form.position}
                  onChange={e => setForm(f => ({ ...f, position: e.target.value }))}
                >
                  {POSITIONS.map(pos => (
                    <option key={pos} value={pos}>{pos}</option>
                  ))}
                </select>
                <select
                  className="w-full h-10 rounded-md border px-3 text-sm bg-background"
                  value={form.role}
                  onChange={e => setForm(f => ({ ...f, role: e.target.value as 'admin' | 'employee' }))}
                >
                  <option value="employee">POS Staff</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <input
                className="w-full h-10 rounded-md border px-3 text-sm bg-background"
                placeholder="Quick PIN (e.g. 1234, optional)"
                maxLength={6}
                value={form.pin}
                onChange={e => setForm(f => ({ ...f, pin: e.target.value }))}
              />
              <label className="flex items-center gap-2 text-sm cursor-pointer select-none pt-1">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
                  className="rounded border"
                />
                Active account (can login)
              </label>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => saveMutation.mutate()}
                disabled={
                  saveMutation.isPending ||
                  !form.name.trim() ||
                  !form.email.trim() ||
                  (!editingEmployeeId && !form.password)
                }
                className="flex-1 h-10 rounded-md bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50"
              >
                {saveMutation.isPending ? 'Saving...' : editingEmployeeId ? 'Update' : 'Create'}
              </button>
              {editingEmployeeId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="h-10 px-4 rounded-md border text-sm"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>

          {/* Employee List */}
          <div className="lg:col-span-2 bg-card rounded-2xl border p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-lg">All Employees</h2>
                <span className="text-xs text-muted-foreground">({filteredEmployees.length})</span>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  className="w-full h-9 rounded-md border pl-9 pr-3 text-sm bg-background"
                  placeholder="Search staff..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
            </div>

            {isLoading ? (
              <p className="text-sm text-muted-foreground py-8 text-center">Loading employees...</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-xs text-muted-foreground">
                      <th className="py-2 text-left">Employee</th>
                      <th className="py-2 text-left">Role & Position</th>
                      <th className="py-2 text-left">Phone / PIN</th>
                      <th className="py-2 text-right">Performance</th>
                      <th className="py-2 text-center">Status</th>
                      <th className="py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEmployees.map(emp => (
                      <tr key={emp.id} className="border-b last:border-0">
                        <td className="py-3">
                          <div className="font-medium">{emp.name}</div>
                          <div className="text-xs text-muted-foreground">{emp.email}</div>
                        </td>
                        <td className="py-3">
                          <div className="text-sm">{emp.position}</div>
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium mt-0.5 ${
                              emp.role === 'admin'
                                ? 'bg-purple-100 text-purple-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}
                          >
                            {emp.role === 'admin' ? 'Admin' : 'POS Staff'}
                          </span>
                        </td>
                        <td className="py-3 text-xs text-muted-foreground">
                          <div>{emp.phone || '-'}</div>
                          {emp.pin && <div className="font-mono mt-0.5">PIN: {emp.pin}</div>}
                        </td>
                        <td className="py-3 text-right">
                          <div className="font-semibold">₨{emp.totalRevenue.toLocaleString()}</div>
                          <div className="text-xs text-muted-foreground">{emp.ordersCount} orders</div>
                        </td>
                        <td className="py-3 text-center">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                              emp.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {emp.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="py-3 text-right space-x-2 whitespace-nowrap">
                          <button
                            onClick={() => handleEdit(emp)}
                            className="text-xs px-2 py-1 rounded-md border hover:bg-muted"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setDeleteTarget({ id: emp.id, name: emp.name })}
                            className="text-xs px-2 py-1 rounded-md border border-destructive text-destructive hover:bg-destructive/10"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredEmployees.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-sm text-muted-foreground">
                          No employees found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title={`Delete Employee "${deleteTarget?.name}"?`}
        description="Are you sure you want to delete this employee account? They will no longer be able to log in."
        isDeleting={deleteMutation.isPending}
        onConfirm={() => {
          if (deleteTarget) {
            deleteMutation.mutate(deleteTarget.id);
          }
        }}
      />
    </AdminSidebar>
  );
};

export default AdminEmployees;
