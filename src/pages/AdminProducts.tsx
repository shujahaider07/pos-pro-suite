import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AdminSidebar from '@/components/pos/AdminSidebar';

interface ManageCategory {
  id: string;
  name: string;
  icon: string;
  subcategories: { id: number; name: string }[];
}

interface ApiProduct {
  id: number;
  name: string;
  price: number;
  categoryId: string;
  subcategory: string | null;
  image: string;
  available: boolean;
}

const AdminProducts = () => {
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

  const { data: products } = useQuery<ApiProduct[]>({
    queryKey: ['products'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/api/products`);
      if (!res.ok) throw new Error('Failed to load products');
      return res.json();
    },
  });

  const [editingProduct, setEditingProduct] = useState<ApiProduct | null>(null);

  const [form, setForm] = useState({
    name: '',
    price: '',
    categoryId: '',
    subcategory: '',
    image: '',
    available: true,
  });

  const resetForm = () => {
    setEditingProduct(null);
    setForm({
      name: '',
      price: '',
      categoryId: '',
      subcategory: '',
      image: '',
      available: true,
    });
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const body = {
        name: form.name,
        price: Number(form.price),
        categoryId: form.categoryId,
        subcategory: form.subcategory || null,
        image: form.image || '🍽️',
        available: form.available,
      };

      if (editingProduct) {
        const res = await fetch(`${API_BASE_URL}/api/products/${editingProduct.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error('Failed to update product');
      } else {
        const res = await fetch(`${API_BASE_URL}/api/products`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error('Failed to create product');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`${API_BASE_URL}/api/products/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete product');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  const handleEdit = (p: ApiProduct) => {
    setEditingProduct(p);
    setForm({
      name: p.name,
      price: String(p.price),
      categoryId: p.categoryId,
      subcategory: p.subcategory ?? '',
      image: p.image,
      available: p.available,
    });
  };

  const currentCategory = categories?.find(c => c.id === form.categoryId);

  return (
    <AdminSidebar>
      <div className="p-8 space-y-8">
        <div>
          <h1 className="text-2xl font-bold mb-1">Products</h1>
          <p className="text-sm text-muted-foreground">Manage menu products, categories and availability</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 bg-card rounded-2xl border p-6 space-y-4">
            <h2 className="font-semibold text-lg">{editingProduct ? 'Edit Product' : 'Add Product'}</h2>
            <div className="space-y-3">
              <input
                className="w-full h-10 rounded-md border px-3 text-sm bg-background"
                placeholder="Name"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              />
              <input
                className="w-full h-10 rounded-md border px-3 text-sm bg-background"
                placeholder="Price"
                type="number"
                value={form.price}
                onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
              />
              <select
                className="w-full h-10 rounded-md border px-3 text-sm bg-background"
                value={form.categoryId}
                onChange={e => setForm(f => ({ ...f, categoryId: e.target.value, subcategory: '' }))}
              >
                <option value="">Select category</option>
                {categories?.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon} {cat.name}
                  </option>
                ))}
              </select>
              <select
                className="w-full h-10 rounded-md border px-3 text-sm bg-background"
                value={form.subcategory}
                onChange={e => setForm(f => ({ ...f, subcategory: e.target.value }))}
                disabled={!currentCategory}
              >
                <option value="">No subcategory</option>
                {currentCategory?.subcategories.map(sub => (
                  <option key={sub.id} value={sub.name}>
                    {sub.name}
                  </option>
                ))}
              </select>
              <input
                className="w-full h-10 rounded-md border px-3 text-sm bg-background"
                placeholder="Emoji or image"
                value={form.image}
                onChange={e => setForm(f => ({ ...f, image: e.target.value }))}
              />
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.available}
                  onChange={e => setForm(f => ({ ...f, available: e.target.checked }))}
                />
                <span>Available</span>
              </label>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => saveMutation.mutate()}
                disabled={!form.name || !form.price || !form.categoryId || saveMutation.isPending}
                className="flex-1 h-10 rounded-md bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50"
              >
                {editingProduct ? 'Update' : 'Create'}
              </button>
              {editingProduct && (
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
              <h2 className="font-semibold text-lg">All Products</h2>
              <span className="text-xs text-muted-foreground">{products?.length ?? 0} items</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-xs text-muted-foreground">
                    <th className="py-2 text-left">Name</th>
                    <th className="py-2 text-left">Category</th>
                    <th className="py-2 text-left">Subcategory</th>
                    <th className="py-2 text-right">Price</th>
                    <th className="py-2 text-center">Available</th>
                    <th className="py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products?.map(p => (
                    <tr key={p.id} className="border-b last:border-0">
                      <td className="py-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{p.image}</span>
                          <span className="font-medium">{p.name}</span>
                        </div>
                      </td>
                      <td className="py-2 text-muted-foreground">{p.categoryId}</td>
                      <td className="py-2 text-muted-foreground">{p.subcategory ?? '-'}</td>
                      <td className="py-2 text-right font-semibold">₨{p.price.toLocaleString()}</td>
                      <td className="py-2 text-center">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                            p.available ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {p.available ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td className="py-2 text-right space-x-2">
                        <button
                          onClick={() => handleEdit(p)}
                          className="text-xs px-2 py-1 rounded-md border"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteMutation.mutate(p.id)}
                          className="text-xs px-2 py-1 rounded-md border border-destructive text-destructive"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                  {!products?.length && (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-sm text-muted-foreground">
                        No products yet. Use the form to add one.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </AdminSidebar>
  );
};

export default AdminProducts;

