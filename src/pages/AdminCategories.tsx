import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AdminSidebar from '@/components/pos/AdminSidebar';

interface ManageCategory {
  id: string;
  name: string;
  icon: string;
  subcategories: { id: number; name: string }[];
}

const AdminCategories = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000';
  const queryClient = useQueryClient();

  const { data: categories } = useQuery<ManageCategory[]>({
    queryKey: ['categories-manage'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/api/categories/manage`);
      if (!res.ok) throw new Error('Failed to load categories');
      return res.json();
    },
  });

  const [categoryForm, setCategoryForm] = useState({
    id: '',
    name: '',
    icon: '',
  });
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);

  const [subcategoryForm, setSubcategoryForm] = useState({
    categoryId: '',
    name: '',
  });
  const [editingSubcategory, setEditingSubcategory] = useState<{ id: number; categoryId: string } | null>(null);

  const saveCategoryMutation = useMutation({
    mutationFn: async () => {
      if (editingCategoryId) {
        const res = await fetch(`${API_BASE_URL}/api/categories/${editingCategoryId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: categoryForm.name, icon: categoryForm.icon }),
        });
        if (!res.ok) throw new Error('Failed to update category');
      } else {
        const res = await fetch(`${API_BASE_URL}/api/categories`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(categoryForm),
        });
        if (!res.ok) throw new Error('Failed to create category');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories-manage'] });
      setEditingCategoryId(null);
      setCategoryForm({ id: '', name: '', icon: '' });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_BASE_URL}/api/categories/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete category');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories-manage'] });
    },
  });

  const saveSubcategoryMutation = useMutation({
    mutationFn: async () => {
      if (editingSubcategory) {
        const res = await fetch(`${API_BASE_URL}/api/categories/subcategories/${editingSubcategory.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: subcategoryForm.name }),
        });
        if (!res.ok) throw new Error('Failed to update subcategory');
      } else {
        const res = await fetch(`${API_BASE_URL}/api/categories/${subcategoryForm.categoryId}/subcategories`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: subcategoryForm.name }),
        });
        if (!res.ok) throw new Error('Failed to create subcategory');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories-manage'] });
      setEditingSubcategory(null);
      setSubcategoryForm({ categoryId: '', name: '' });
    },
  });

  const deleteSubcategoryMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`${API_BASE_URL}/api/categories/subcategories/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete subcategory');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories-manage'] });
    },
  });

  const handleEditCategory = (cat: ManageCategory) => {
    setEditingCategoryId(cat.id);
    setCategoryForm({ id: cat.id, name: cat.name, icon: cat.icon });
  };

  const handleEditSubcategory = (catId: string, sub: { id: number; name: string }) => {
    setEditingSubcategory({ id: sub.id, categoryId: catId });
    setSubcategoryForm({ categoryId: catId, name: sub.name });
  };

  return (
    <AdminSidebar>
      <div className="p-8 space-y-8">
        <div>
          <h1 className="text-2xl font-bold mb-1">Categories</h1>
          <p className="text-sm text-muted-foreground">Manage menu categories and subcategories</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="bg-card rounded-2xl border p-6 space-y-4">
            <h2 className="font-semibold text-lg">{editingCategoryId ? 'Edit Category' : 'Add Category'}</h2>
            <div className="space-y-3">
              {!editingCategoryId && (
                <input
                  className="w-full h-10 rounded-md border px-3 text-sm bg-background"
                  placeholder="Category ID (e.g. starters)"
                  value={categoryForm.id}
                  onChange={e => setCategoryForm(f => ({ ...f, id: e.target.value }))}
                />
              )}
              <input
                className="w-full h-10 rounded-md border px-3 text-sm bg-background"
                placeholder="Category name"
                value={categoryForm.name}
                onChange={e => setCategoryForm(f => ({ ...f, name: e.target.value }))}
              />
              <input
                className="w-full h-10 rounded-md border px-3 text-sm bg-background"
                placeholder="Icon (emoji)"
                value={categoryForm.icon}
                onChange={e => setCategoryForm(f => ({ ...f, icon: e.target.value }))}
              />
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => saveCategoryMutation.mutate()}
                disabled={saveCategoryMutation.isPending || !categoryForm.name || (!editingCategoryId && !categoryForm.id)}
                className="flex-1 h-10 rounded-md bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50"
              >
                {editingCategoryId ? 'Update' : 'Create'}
              </button>
              {editingCategoryId && (
                <button
                  type="button"
                  onClick={() => { setEditingCategoryId(null); setCategoryForm({ id: '', name: '', icon: '' }); }}
                  className="h-10 px-4 rounded-md border text-sm"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>

          <div className="bg-card rounded-2xl border p-6 space-y-4">
            <h2 className="font-semibold text-lg">{editingSubcategory ? 'Edit Subcategory' : 'Add Subcategory'}</h2>
            <div className="space-y-3">
              <select
                className="w-full h-10 rounded-md border px-3 text-sm bg-background"
                value={subcategoryForm.categoryId}
                onChange={e => setSubcategoryForm(f => ({ ...f, categoryId: e.target.value }))}
              >
                <option value="">Select category</option>
                {categories?.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon} {cat.name}
                  </option>
                ))}
              </select>
              <input
                className="w-full h-10 rounded-md border px-3 text-sm bg-background"
                placeholder="Subcategory name"
                value={subcategoryForm.name}
                onChange={e => setSubcategoryForm(f => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => saveSubcategoryMutation.mutate()}
                disabled={saveSubcategoryMutation.isPending || !subcategoryForm.categoryId || !subcategoryForm.name}
                className="flex-1 h-10 rounded-md bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50"
              >
                {editingSubcategory ? 'Update' : 'Create'}
              </button>
              {editingSubcategory && (
                <button
                  type="button"
                  onClick={() => { setEditingSubcategory(null); setSubcategoryForm({ categoryId: '', name: '' }); }}
                  className="h-10 px-4 rounded-md border text-sm"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>

          <div className="lg:col-span-1 bg-card rounded-2xl border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg">All Categories</h2>
              <span className="text-xs text-muted-foreground">{categories?.length ?? 0} items</span>
            </div>
            <div className="space-y-4 max-h-[480px] overflow-y-auto">
              {categories?.map(cat => (
                <div key={cat.id} className="border rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{cat.icon}</span>
                        <span className="font-semibold">{cat.name}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{cat.id}</p>
                    </div>
                    <div className="space-x-2">
                      <button
                        onClick={() => handleEditCategory(cat)}
                        className="text-xs px-2 py-1 rounded-md border"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteCategoryMutation.mutate(cat.id)}
                        className="text-xs px-2 py-1 rounded-md border border-destructive text-destructive"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <div className="mt-2">
                    <p className="text-xs font-semibold text-muted-foreground mb-1">Subcategories</p>
                    {cat.subcategories.length === 0 && (
                      <p className="text-xs text-muted-foreground">None</p>
                    )}
                    {cat.subcategories.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {cat.subcategories.map(sub => (
                          <div
                            key={sub.id}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-xs"
                          >
                            <span>{sub.name}</span>
                            <button
                              onClick={() => handleEditSubcategory(cat.id, sub)}
                              className="text-[10px] underline"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => deleteSubcategoryMutation.mutate(sub.id)}
                              className="text-[10px] text-destructive"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {!categories?.length && (
                <p className="text-sm text-muted-foreground">No categories yet. Add one to get started.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminSidebar>
  );
};

export default AdminCategories;

