import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { parseApiError } from '@/lib/api-error';
import AdminSidebar from '@/components/pos/AdminSidebar';
import ConfirmDeleteDialog from '@/components/pos/ConfirmDeleteDialog';
import type { TableData } from '@/lib/mock-data';

const AdminTables = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000';
  const queryClient = useQueryClient();

  const { data: tables } = useQuery<TableData[]>({
    queryKey: ['tables'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/api/tables`);
      if (!res.ok) throw new Error('Failed to load tables');
      return res.json();
    },
  });

  const [editingTableId, setEditingTableId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);
  const [form, setForm] = useState({
    name: '',
    capacity: '',
  });

  const resetForm = () => {
    setEditingTableId(null);
    setForm({ name: '', capacity: '' });
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const body = {
        name: form.name.trim(),
        capacity: Number(form.capacity),
      };

      if (editingTableId) {
        const res = await fetch(`${API_BASE_URL}/api/tables/${editingTableId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          throw new Error(await parseApiError(res, 'Failed to update table'));
        }
      } else {
        const res = await fetch(`${API_BASE_URL}/api/tables`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          throw new Error(await parseApiError(res, 'Failed to create table'));
        }
      }
    },
    onSuccess: () => {
      toast.success(editingTableId ? 'Table updated successfully' : 'Table created successfully');
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to save table');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`${API_BASE_URL}/api/tables/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        throw new Error(await parseApiError(res, 'Failed to delete table'));
      }
    },
    onSuccess: () => {
      toast.success('Table deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      setDeleteTarget(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete table');
      setDeleteTarget(null);
    },
  });

  const handleEdit = (t: TableData) => {
    setEditingTableId(t.id);
    setForm({
      name: t.name,
      capacity: String(t.capacity),
    });
  };

  return (
    <AdminSidebar>
      <div className="p-8 space-y-8">
        <div>
          <h1 className="text-2xl font-bold mb-1">Tables</h1>
          <p className="text-sm text-muted-foreground">Manage table names and seating capacity</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="bg-card rounded-2xl border p-6 space-y-4">
            <h2 className="font-semibold text-lg">{editingTableId ? 'Edit Table' : 'Add Table'}</h2>
            <div className="space-y-3">
              <input
                className="w-full h-10 rounded-md border px-3 text-sm bg-background"
                placeholder="Table name (e.g. T11)"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              />
              <input
                className="w-full h-10 rounded-md border px-3 text-sm bg-background"
                placeholder="Capacity"
                type="number"
                value={form.capacity}
                onChange={e => setForm(f => ({ ...f, capacity: e.target.value }))}
              />
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => saveMutation.mutate()}
                disabled={!form.name.trim() || !form.capacity || Number(form.capacity) <= 0 || saveMutation.isPending}
                className="flex-1 h-10 rounded-md bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50"
              >
                {saveMutation.isPending ? 'Saving...' : editingTableId ? 'Update' : 'Create'}
              </button>
              {editingTableId && (
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

          <div className="lg:col-span-2 bg-card rounded-2xl border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg">All Tables</h2>
              <span className="text-xs text-muted-foreground">{tables?.length ?? 0} items</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-xs text-muted-foreground">
                    <th className="py-2 text-left">Name</th>
                    <th className="py-2 text-left">Status</th>
                    <th className="py-2 text-right">Capacity</th>
                    <th className="py-2 text-right">Current Total</th>
                    <th className="py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tables?.map(t => (
                    <tr key={t.id} className="border-b last:border-0">
                      <td className="py-2 font-medium">{t.name}</td>
                      <td className="py-2">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                            t.status === 'available'
                              ? 'bg-emerald-100 text-emerald-700'
                              : t.status === 'occupied'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-rose-100 text-rose-700'
                          }`}
                        >
                          {t.status.charAt(0).toUpperCase() + t.status.slice(1)}
                        </span>
                      </td>
                      <td className="py-2 text-right">{t.capacity}</td>
                      <td className="py-2 text-right">
                        {t.orderTotal != null ? `₨${t.orderTotal.toLocaleString()}` : '-'}
                      </td>
                      <td className="py-2 text-right space-x-2">
                        <button
                          onClick={() => handleEdit(t)}
                          className="text-xs px-2 py-1 rounded-md border hover:bg-muted"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setDeleteTarget({ id: t.id, name: t.name })}
                          className="text-xs px-2 py-1 rounded-md border border-destructive text-destructive hover:bg-destructive/10"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                  {!tables?.length && (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-sm text-muted-foreground">
                        No tables yet. Use the form to add one.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title={`Delete Table "${deleteTarget?.name}"?`}
        description="Are you sure you want to delete this table? If this table has active or past orders, it cannot be deleted."
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

export default AdminTables;
