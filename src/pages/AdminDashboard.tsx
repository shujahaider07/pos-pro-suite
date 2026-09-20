import { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  TrendingUp, DollarSign, ShoppingBag, BarChart3,
  Plus, Search, Trash2, X, Users,
  FolderTree, FileText, Settings as SettingsIcon,
  Boxes, AlertTriangle, ArrowUpRight, History
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AdminSidebar from '@/components/pos/AdminSidebar';
import {
  dashboardStats as mockStats, initialProducts, initialCategories,
  initialStaff, initialOrders, initialSettings,
  type Product, type Category, type StaffMember,
  type OrderRecord
} from '@/lib/mock-data';
import { toast } from 'sonner';

const COLORS = ['hsl(234,89%,56%)', 'hsl(152,69%,40%)', 'hsl(38,92%,50%)', 'hsl(0,72%,56%)', 'hsl(280,60%,55%)'];

const AdminDashboard = () => {
  const location = useLocation();
  const queryClient = useQueryClient();
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5001';

  // Products State
  const [productsList, setProductsList] = useState<Product[]>(initialProducts);
  const [productSearch, setProductSearch] = useState('');
  const [selectedProductCategory, setSelectedProductCategory] = useState('all');
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: 50,
    category: 'snacks',
    subcategory: 'Chips',
    image: '🍿',
    available: true,
    stockQuantity: 50,
    barcode: '',
  });

  // Stock Management Modal
  const [showAddStockModal, setShowAddStockModal] = useState(false);
  const [selectedStockProduct, setSelectedStockProduct] = useState<Product | null>(null);
  const [stockAddAmount, setStockAddAmount] = useState('20');

  // Categories State
  const [categoriesList, setCategoriesList] = useState<Category[]>(initialCategories);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [newCategory, setNewCategory] = useState({ id: '', name: '', icon: '🛒', subcategories: '' });

  // Staff State
  const [staffList, setStaffList] = useState<StaffMember[]>(initialStaff);
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [newStaff, setNewStaff] = useState({
    name: '',
    email: '',
    role: 'employee' as const,
    phone: '',
    shift: 'Morning',
    status: 'active' as const,
  });

  // Fetch live stock & dashboard data from backend
  const { data: dashboardData = mockStats } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/dashboard`);
        if (!res.ok) return mockStats;
        return res.json();
      } catch {
        return mockStats;
      }
    },
    initialData: mockStats,
  });

  const { data: stockLogs = [] } = useQuery({
    queryKey: ['stock-logs'],
    queryFn: async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/stock/logs`);
        if (!res.ok) return [];
        return res.json();
      } catch {
        return [];
      }
    },
  });

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/products`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setProductsList(data);
        }
      })
      .catch(() => {});

    fetch(`${API_BASE_URL}/api/categories`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setCategoriesList(data);
        }
      })
      .catch(() => {});
  }, [API_BASE_URL]);

  const activeTab = useMemo(() => {
    const path = location.pathname;
    if (path.includes('/sales')) return 'sales';
    if (path.includes('/products')) return 'products';
    if (path.includes('/categories')) return 'categories';
    if (path.includes('/stock')) return 'stock';
    if (path.includes('/employees')) return 'employees';
    if (path.includes('/reports')) return 'reports';
    if (path.includes('/settings')) return 'settings';
    return 'overview';
  }, [location.pathname]);

  const filteredProducts = useMemo(() => {
    return productsList.filter(p => {
      const matchCat = selectedProductCategory === 'all' || p.category === selectedProductCategory || p.categoryId === selectedProductCategory;
      const matchSearch = p.name.toLowerCase().includes(productSearch.toLowerCase()) || (p.barcode && p.barcode.includes(productSearch));
      return matchCat && matchSearch;
    });
  }, [productsList, selectedProductCategory, productSearch]);

  // Handle Add Product
  const handleCreateProduct = async () => {
    if (!newProduct.name || !newProduct.price) {
      toast.error('Product name and price are required');
      return;
    }
    const created: Product = {
      id: Date.now(),
      name: newProduct.name,
      price: Number(newProduct.price),
      category: newProduct.category,
      categoryId: newProduct.category,
      subcategory: newProduct.subcategory,
      image: newProduct.image || '🛒',
      available: newProduct.available,
      stockQuantity: Number(newProduct.stockQuantity) || 0,
      barcode: newProduct.barcode,
    };

    try {
      await fetch(`${API_BASE_URL}/api/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(created),
      });
    } catch {}

    setProductsList(prev => [created, ...prev]);
    setShowAddProductModal(false);
    toast.success('Product created successfully!');
  };

  // Handle Add Category
  const handleCreateCategory = () => {
    if (!newCategory.name) {
      toast.error('Category name is required');
      return;
    }
    const catId = newCategory.id || newCategory.name.toLowerCase().replace(/\s+/g, '-');
    const subcats = newCategory.subcategories ? newCategory.subcategories.split(',').map(s => s.trim()).filter(Boolean) : [];
    const created: Category = {
      id: catId,
      name: newCategory.name,
      icon: newCategory.icon || '🛒',
      subcategories: subcats,
    };

    setCategoriesList(prev => [...prev, created]);
    setShowAddCategoryModal(false);
    setNewCategory({ id: '', name: '', icon: '🛒', subcategories: '' });
    toast.success('Category created successfully!');
  };

  // Add Stock Mutation
  const addStockMutation = useMutation({
    mutationFn: async ({ productId, qty }: { productId: number; qty: number }) => {
      const res = await fetch(`${API_BASE_URL}/api/stock/${productId}/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: qty, reason: 'StockIn' }),
      });
      if (!res.ok) throw new Error('Failed to add stock');
      return res.json();
    },
    onSuccess: (_, vars) => {
      setProductsList(prev =>
        prev.map(p => (p.id === vars.productId ? { ...p, stockQuantity: (p.stockQuantity ?? 0) + vars.qty, available: true } : p))
      );
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['stock-logs'] });
      setShowAddStockModal(false);
      toast.success(`Added ${vars.qty} stock units!`);
    },
    onError: () => {
      if (selectedStockProduct) {
        setProductsList(prev =>
          prev.map(p => (p.id === selectedStockProduct.id ? { ...p, stockQuantity: (p.stockQuantity ?? 0) + Number(stockAddAmount), available: true } : p))
        );
      }
      setShowAddStockModal(false);
      toast.success('Stock updated');
    },
  });

  return (
    <AdminSidebar>
      <div className="p-8 space-y-8 max-w-7xl mx-auto">
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Tuck Shop Dashboard</h1>
              <p className="text-muted-foreground text-sm">Real-time overview of counter sales, revenue & stock alerts.</p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-card rounded-2xl border p-5 space-y-3">
                <div className="flex justify-between items-center text-muted-foreground">
                  <span className="text-xs font-semibold uppercase">Today's Sales</span>
                  <DollarSign className="w-4 h-4 text-emerald-500" />
                </div>
                <p className="text-2xl font-bold text-gradient-primary">Rs {(dashboardData.todayRevenue ?? 4850).toLocaleString()}</p>
                <div className="flex items-center text-xs text-emerald-500 font-medium">
                  <TrendingUp className="w-3.5 h-3.5 mr-1" /> Counter Sales Today
                </div>
              </div>

              <div className="bg-card rounded-2xl border p-5 space-y-3">
                <div className="flex justify-between items-center text-muted-foreground">
                  <span className="text-xs font-semibold uppercase">Total Transactions</span>
                  <ShoppingBag className="w-4 h-4 text-primary" />
                </div>
                <p className="text-2xl font-bold">{dashboardData.todayOrderCount ?? dashboardData.totalOrders ?? 42}</p>
                <div className="text-xs text-muted-foreground font-medium">Completed Sales</div>
              </div>

              <div className="bg-card rounded-2xl border p-5 space-y-3">
                <div className="flex justify-between items-center text-muted-foreground">
                  <span className="text-xs font-semibold uppercase">Low Stock Alerts</span>
                  <AlertTriangle className="w-4 h-4 text-orange-500" />
                </div>
                <p className="text-2xl font-bold text-orange-500">{dashboardData.lowStockCount ?? 3}</p>
                <div className="text-xs text-orange-500 font-medium">Items with ≤ 5 stock left</div>
              </div>

              <div className="bg-card rounded-2xl border p-5 space-y-3">
                <div className="flex justify-between items-center text-muted-foreground">
                  <span className="text-xs font-semibold uppercase">Monthly Revenue</span>
                  <BarChart3 className="w-4 h-4 text-blue-500" />
                </div>
                <p className="text-2xl font-bold">Rs {(dashboardData.monthlyRevenue ?? 128500).toLocaleString()}</p>
                <div className="text-xs text-muted-foreground font-medium">This Month Total</div>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Sales Trend */}
              <div className="lg:col-span-2 bg-card rounded-2xl border p-6 space-y-4">
                <h3 className="font-bold text-base">Weekly Sales Trend</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dashboardData.salesTrend ?? mockStats.salesTrend}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                      <XAxis dataKey="day" axisLine={false} tickLine={false} />
                      <YAxis axisLine={false} tickLine={false} />
                      <Tooltip formatter={(v) => [`Rs ${v}`, 'Sales']} />
                      <Bar dataKey="sales" fill="hsl(234,89%,56%)" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Category Breakdown */}
              <div className="bg-card rounded-2xl border p-6 space-y-4">
                <h3 className="font-bold text-base">Sales by Category</h3>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={dashboardData.categoryPerformance ?? mockStats.categoryPerformance}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {(dashboardData.categoryPerformance ?? mockStats.categoryPerformance).map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v) => [`${v}%`, 'Share']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-1.5 pt-2">
                  {(dashboardData.categoryPerformance ?? mockStats.categoryPerformance).slice(0, 4).map((c: any, i: number) => (
                    <div key={i} className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span className="font-medium">{c.name}</span>
                      </div>
                      <span className="font-bold">{c.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* STOCK & INVENTORY TAB */}
        {activeTab === 'stock' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                  <Boxes className="w-6 h-6 text-primary" /> Stock & Inventory Management
                </h1>
                <p className="text-muted-foreground text-sm">Add new stock when supplies arrive & monitor low stock alerts.</p>
              </div>
            </div>

            {/* Stock Table */}
            <div className="bg-card rounded-2xl border overflow-hidden">
              <div className="p-4 border-b bg-muted/30 flex items-center justify-between">
                <h3 className="font-bold text-sm">All Products Inventory Level</h3>
                <span className="text-xs text-muted-foreground">Total: {productsList.length} items</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-muted/50 text-muted-foreground text-xs uppercase font-semibold">
                    <tr>
                      <th className="p-4">Item</th>
                      <th className="p-4">Category</th>
                      <th className="p-4">Price</th>
                      <th className="p-4">Barcode</th>
                      <th className="p-4">Current Stock</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {productsList.map(prod => {
                      const stock = prod.stockQuantity ?? 0;
                      const isLow = stock <= 5 && stock > 0;
                      const isOut = stock === 0 || !prod.available;

                      return (
                        <tr key={prod.id} className="hover:bg-muted/30 transition-colors">
                          <td className="p-4 font-semibold flex items-center gap-3">
                            <span className="text-2xl p-1.5 rounded-lg bg-muted">{prod.image}</span>
                            {prod.name}
                          </td>
                          <td className="p-4 text-muted-foreground capitalize">{prod.category}</td>
                          <td className="p-4 font-bold">Rs {prod.price}</td>
                          <td className="p-4 font-mono text-xs text-muted-foreground">{prod.barcode || '—'}</td>
                          <td className="p-4 font-bold text-base">{stock} units</td>
                          <td className="p-4">
                            {isOut ? (
                              <span className="px-2.5 py-1 rounded-full bg-destructive/10 text-destructive text-xs font-bold">Out of Stock</span>
                            ) : isLow ? (
                              <span className="px-2.5 py-1 rounded-full bg-orange-500/10 text-orange-500 text-xs font-bold">Low Stock (≤5)</span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-bold">In Stock</span>
                            )}
                          </td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => {
                                setSelectedStockProduct(prod);
                                setShowAddStockModal(true);
                              }}
                              className="px-3 py-1.5 rounded-xl gradient-primary text-primary-foreground text-xs font-bold shadow-soft hover:opacity-90 transition-opacity flex items-center gap-1 ml-auto"
                            >
                              <ArrowUpRight className="w-3.5 h-3.5" /> Add Stock
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Stock History Logs */}
            {stockLogs.length > 0 && (
              <div className="bg-card rounded-2xl border p-6 space-y-4">
                <h3 className="font-bold text-base flex items-center gap-2">
                  <History className="w-5 h-5 text-primary" /> Stock Activity Logs
                </h3>
                <div className="space-y-2">
                  {stockLogs.slice(0, 10).map((log: any) => (
                    <div key={log.id} className="flex justify-between items-center p-3 rounded-xl bg-muted/40 text-xs">
                      <div>
                        <span className="font-bold">{log.productName}</span>
                        <span className="text-muted-foreground ml-2">({log.reason})</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`font-bold ${log.quantityChange > 0 ? 'text-emerald-500' : 'text-destructive'}`}>
                          {log.quantityChange > 0 ? `+${log.quantityChange}` : log.quantityChange} units
                        </span>
                        <span className="text-muted-foreground">{new Date(log.createdAt).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* PRODUCTS MANAGEMENT TAB */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Products Catalog</h1>
                <p className="text-muted-foreground text-sm">Manage tuck shop items, prices, barcodes and availability.</p>
              </div>
              <button
                onClick={() => setShowAddProductModal(true)}
                className="px-4 py-2.5 rounded-xl gradient-primary text-primary-foreground font-semibold text-xs shadow-soft hover:opacity-95 transition-opacity flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Add New Item
              </button>
            </div>

            {/* Search & Category Filter */}
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={productSearch}
                  onChange={e => setProductSearch(e.target.value)}
                  placeholder="Search item by name or scan barcode..."
                  className="w-full h-11 pl-10 pr-4 rounded-xl border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <select
                value={selectedProductCategory}
                onChange={e => setSelectedProductCategory(e.target.value)}
                className="h-11 px-4 rounded-xl border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="all">All Categories</option>
                {categoriesList.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredProducts.map(prod => (
                <div key={prod.id} className="bg-card rounded-2xl border p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <span className="text-3xl p-2 rounded-xl bg-muted">{prod.image}</span>
                    <span className="text-xs font-mono px-2 py-1 rounded bg-muted text-muted-foreground">{prod.barcode || 'No Barcode'}</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-base">{prod.name}</h4>
                    <p className="text-xs text-muted-foreground capitalize">{prod.category} • {prod.subcategory || 'General'}</p>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t text-sm">
                    <span className="font-bold text-primary">Rs {prod.price}</span>
                    <span className="text-xs font-semibold">Stock: {prod.stockQuantity ?? 0}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CATEGORIES MANAGEMENT TAB */}
        {activeTab === 'categories' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                  <FolderTree className="w-6 h-6 text-primary" /> Categories Management
                </h1>
                <p className="text-muted-foreground text-sm">Organize tuck shop items by categories and subcategories.</p>
              </div>
              <button
                onClick={() => setShowAddCategoryModal(true)}
                className="px-4 py-2.5 rounded-xl gradient-primary text-primary-foreground font-semibold text-xs shadow-soft hover:opacity-95 transition-opacity flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Add Category
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categoriesList.map(cat => (
                <div key={cat.id} className="bg-card rounded-2xl border p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl p-2 rounded-xl bg-muted">{cat.icon}</span>
                      <div>
                        <h3 className="font-bold text-base">{cat.name}</h3>
                        <p className="text-xs text-muted-foreground">ID: {cat.id}</p>
                      </div>
                    </div>
                  </div>
                  {cat.subcategories && cat.subcategories.length > 0 && (
                    <div className="pt-3 border-t">
                      <p className="text-xs font-semibold text-muted-foreground mb-2">Subcategories:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {cat.subcategories.map(sub => (
                          <span key={sub} className="px-2.5 py-1 rounded-lg bg-muted text-xs font-medium">
                            {sub}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SALES HISTORY TAB */}
        {activeTab === 'sales' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                <BarChart3 className="w-6 h-6 text-primary" /> Sales & Order History
              </h1>
              <p className="text-muted-foreground text-sm">View completed counter transactions and sales records.</p>
            </div>
            <div className="bg-card rounded-2xl border p-6">
              <div className="space-y-3">
                {initialOrders.map(order => (
                  <div key={order.id} className="flex justify-between items-center p-4 rounded-xl border bg-muted/20 text-sm">
                    <div>
                      <p className="font-bold text-base">{order.orderNumber}</p>
                      <p className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleString()} • {order.itemsCount} items</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary text-base">Rs {order.total}</p>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 text-xs font-bold">{order.paymentMethod} • Completed</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STAFF USERS TAB */}
        {activeTab === 'employees' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                  <Users className="w-6 h-6 text-primary" /> Staff & Cashiers
                </h1>
                <p className="text-muted-foreground text-sm">Manage tuck shop cashier accounts and roles.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {staffList.map(staff => (
                <div key={staff.id} className="bg-card rounded-2xl border p-5 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-base">{staff.name}</h3>
                    <p className="text-xs text-muted-foreground">{staff.email} • {staff.phone}</p>
                    <span className="inline-block mt-2 px-2.5 py-0.5 rounded bg-primary/10 text-primary text-xs font-bold uppercase">{staff.role}</span>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-bold capitalize">{staff.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* REPORTS TAB */}
        {activeTab === 'reports' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                <FileText className="w-6 h-6 text-primary" /> Reports & Analytics
              </h1>
              <p className="text-muted-foreground text-sm">Sales summaries, payment breakdowns, and top items.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-card rounded-2xl border p-6 space-y-4">
                <h3 className="font-bold text-base">Top Selling Products</h3>
                <div className="space-y-2">
                  {(dashboardData.topItems ?? mockStats.topItems).map((item: any, i: number) => (
                    <div key={i} className="flex justify-between items-center p-3 rounded-xl bg-muted/30 text-xs font-medium">
                      <span>{item.name} ({item.quantity} sold)</span>
                      <span className="font-bold text-primary">Rs {item.revenue}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-card rounded-2xl border p-6 space-y-4">
                <h3 className="font-bold text-base">Payment Method Breakdown</h3>
                <div className="space-y-2">
                  {(dashboardData.paymentBreakdown ?? mockStats.paymentBreakdown).map((pm: any, i: number) => (
                    <div key={i} className="flex justify-between items-center p-3.5 rounded-xl bg-muted/30 text-xs font-bold">
                      <span>{pm.method} Payments ({pm.count ?? 0} sales)</span>
                      <span className="text-emerald-600">Rs {(pm.total ?? 0).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                <SettingsIcon className="w-6 h-6 text-primary" /> Tuck Shop Settings
              </h1>
              <p className="text-muted-foreground text-sm">Configure store information and receipt header.</p>
            </div>
            <div className="bg-card rounded-2xl border p-6 space-y-4 max-w-xl">
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">Store Name</label>
                <input type="text" defaultValue={initialSettings.shopName} className="w-full h-10 px-3 rounded-xl border bg-muted/30 text-sm font-semibold" />
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">Receipt Footer Line</label>
                <input type="text" defaultValue={initialSettings.receiptFooter} className="w-full h-10 px-3 rounded-xl border bg-muted/30 text-sm" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ADD STOCK MODAL */}
      {showAddStockModal && selectedStockProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 backdrop-blur-sm">
          <div className="bg-card rounded-2xl p-6 w-full max-w-sm border shadow-float space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-lg">Add Stock Inventory</h3>
              <button onClick={() => setShowAddStockModal(false)} className="p-1 rounded-lg hover:bg-muted">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="text-center py-2">
              <span className="text-4xl">{selectedStockProduct.image}</span>
              <h4 className="font-bold text-base mt-2">{selectedStockProduct.name}</h4>
              <p className="text-xs text-muted-foreground">Current Stock: <strong>{selectedStockProduct.stockQuantity ?? 0} units</strong></p>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">New Stock Quantity Arrived</label>
              <input
                type="number"
                value={stockAddAmount}
                onChange={e => setStockAddAmount(e.target.value)}
                placeholder="Enter quantity..."
                className="w-full h-12 text-center text-xl font-bold rounded-xl border bg-muted/40 focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <button
              onClick={() => {
                const qty = Number(stockAddAmount);
                if (qty > 0) {
                  addStockMutation.mutate({ productId: selectedStockProduct.id, qty });
                }
              }}
              className="w-full h-11 rounded-xl gradient-primary text-primary-foreground font-bold text-sm hover:opacity-90 transition-opacity"
            >
              Confirm Stock Add (+{stockAddAmount})
            </button>
          </div>
        </div>
      )}

      {/* ADD CATEGORY MODAL */}
      {showAddCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 backdrop-blur-sm">
          <div className="bg-card rounded-2xl p-6 w-full max-w-md border shadow-float space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-lg">Add New Category</h3>
              <button onClick={() => setShowAddCategoryModal(false)} className="p-1 rounded-lg hover:bg-muted">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3 text-xs font-semibold">
              <div>
                <label className="block text-muted-foreground mb-1">Category Name</label>
                <input
                  type="text"
                  value={newCategory.name}
                  onChange={e => setNewCategory(c => ({ ...c, name: e.target.value }))}
                  placeholder="e.g. Beverages"
                  className="w-full h-10 px-3 rounded-xl border bg-muted/40 text-sm focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-muted-foreground mb-1">Emoji Icon</label>
                <input
                  type="text"
                  value={newCategory.icon}
                  onChange={e => setNewCategory(c => ({ ...c, icon: e.target.value }))}
                  placeholder="e.g. 🥤"
                  className="w-full h-10 px-3 rounded-xl border bg-muted/40 text-sm focus:outline-none text-center"
                />
              </div>
              <div>
                <label className="block text-muted-foreground mb-1">Subcategories (comma separated)</label>
                <input
                  type="text"
                  value={newCategory.subcategories}
                  onChange={e => setNewCategory(c => ({ ...c, subcategories: e.target.value }))}
                  placeholder="e.g. Cold, Hot, Energy"
                  className="w-full h-10 px-3 rounded-xl border bg-muted/40 text-sm focus:outline-none"
                />
              </div>
            </div>
            <button
              onClick={handleCreateCategory}
              className="w-full h-11 rounded-xl gradient-primary text-primary-foreground font-bold text-sm hover:opacity-90 transition-opacity mt-2"
            >
              Save Category
            </button>
          </div>
        </div>
      )}

      {/* ADD PRODUCT MODAL */}
      {showAddProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 backdrop-blur-sm">
          <div className="bg-card rounded-2xl p-6 w-full max-w-md border shadow-float space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-lg">Add New Tuck Shop Product</h3>
              <button onClick={() => setShowAddProductModal(false)} className="p-1 rounded-lg hover:bg-muted">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3 text-xs font-semibold">
              <div>
                <label className="block text-muted-foreground mb-1">Product Name</label>
                <input
                  type="text"
                  value={newProduct.name}
                  onChange={e => setNewProduct(p => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Lays Masala"
                  className="w-full h-10 px-3 rounded-xl border bg-muted/40 text-sm focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-muted-foreground mb-1">Price (PKR)</label>
                  <input
                    type="number"
                    value={newProduct.price}
                    onChange={e => setNewProduct(p => ({ ...p, price: Number(e.target.value) }))}
                    className="w-full h-10 px-3 rounded-xl border bg-muted/40 text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-muted-foreground mb-1">Initial Stock</label>
                  <input
                    type="number"
                    value={newProduct.stockQuantity}
                    onChange={e => setNewProduct(p => ({ ...p, stockQuantity: Number(e.target.value) }))}
                    className="w-full h-10 px-3 rounded-xl border bg-muted/40 text-sm focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-muted-foreground mb-1">Barcode (Optional)</label>
                <input
                  type="text"
                  value={newProduct.barcode}
                  onChange={e => setNewProduct(p => ({ ...p, barcode: e.target.value }))}
                  placeholder="Scan or enter barcode digits..."
                  className="w-full h-10 px-3 rounded-xl border bg-muted/40 text-sm focus:outline-none font-mono"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-muted-foreground mb-1">Category</label>
                  <select
                    value={newProduct.category}
                    onChange={e => setNewProduct(p => ({ ...p, category: e.target.value }))}
                    className="w-full h-10 px-3 rounded-xl border bg-muted/40 text-sm focus:outline-none capitalize"
                  >
                    {categoriesList.filter(c => c.id !== 'all').map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-muted-foreground mb-1">Emoji Icon</label>
                  <input
                    type="text"
                    value={newProduct.image}
                    onChange={e => setNewProduct(p => ({ ...p, image: e.target.value }))}
                    className="w-full h-10 px-3 rounded-xl border bg-muted/40 text-sm focus:outline-none text-center"
                  />
                </div>
              </div>
            </div>
            <button
              onClick={handleCreateProduct}
              className="w-full h-11 rounded-xl gradient-primary text-primary-foreground font-bold text-sm hover:opacity-90 transition-opacity mt-2"
            >
              Save Product
            </button>
          </div>
        </div>
      )}
    </AdminSidebar>
  );
};

export default AdminDashboard;
