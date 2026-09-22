import { useState, useMemo, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  TrendingUp, DollarSign, ShoppingBag, BarChart3,
  Plus, Search, Trash2, X, Users,
  FolderTree, FileText, Settings as SettingsIcon,
  Boxes, AlertTriangle, ArrowUpRight, History, UserCheck, Filter, Printer, Download
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AdminSidebar from '@/components/pos/AdminSidebar';
import ReturnModal from '@/components/pos/ReturnModal';
import { RotateCcw } from 'lucide-react';
import { useAuth } from '@/lib/pos-context';
import {
  dashboardStats as mockStats, initialProducts, initialCategories,
  initialStaff, initialOrders, initialSettings, getStoredTaxRate, setStoredTaxRate,
  type Product, type Category, type StaffMember,
  type OrderRecord
} from '@/lib/mock-data';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/config/api';

const COLORS = ['hsl(234,89%,56%)', 'hsl(152,69%,40%)', 'hsl(38,92%,50%)', 'hsl(0,72%,56%)', 'hsl(280,60%,55%)'];

const AdminDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { userName } = useAuth();

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
    image: '📦',
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
  const [newCategory, setNewCategory] = useState({ id: '', name: '', icon: '🏪', subcategories: '' });

  // Return Modal State
  const [selectedReturnOrder, setSelectedReturnOrder] = useState<any | null>(null);

  // Cashier Filter for Sales & Performance
  const [selectedCashierFilter, setSelectedCashierFilter] = useState<string>('all');

  // Active Tab Sync with Sidebar pathname & hash
  const activeTab = useMemo(() => {
    const path = location.pathname.toLowerCase();
    if (path.includes('/admin/stock') || path.includes('/admin/inventory') || path.includes('/admin/products')) {
      return 'inventory';
    }
    if (path.includes('/admin/categories')) return 'categories';
    if (path.includes('/admin/sales')) return 'sales';
    if (path.includes('/admin/employees') || path.includes('/admin/staff')) return 'employees';
    if (path.includes('/admin/reports')) return 'reports';
    if (path.includes('/admin/settings')) return 'settings';

    // Hash fallback
    const hash = location.hash.replace('#', '').toLowerCase();
    if (hash === 'products' || hash === 'stock' || hash === 'inventory') return 'inventory';
    if (hash === 'categories') return 'categories';
    if (hash === 'sales') return 'sales';
    if (hash === 'employees' || hash === 'staff') return 'employees';
    if (hash === 'reports') return 'reports';
    if (hash === 'settings') return 'settings';

    return 'overview';
  }, [location.pathname, location.hash]);

  // Orders Query (Admin fetches all orders)
  const { data: ordersList = initialOrders } = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/orders?role=admin`);
        if (!res.ok) return initialOrders;
        const data = await res.json();
        return Array.isArray(data) && data.length > 0 ? data : initialOrders;
      } catch {
        return initialOrders;
      }
    },
    initialData: initialOrders,
  });

  // Settings State
  const [gstRate, setGstRate] = useState<number>(getStoredTaxRate());

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

  // Fetch live dashboard data from backend
  const { data: dashboardData = mockStats } = useQuery({
    queryKey: ['dashboard', selectedCashierFilter],
    queryFn: async () => {
      try {
        const params = new URLSearchParams();
        params.append('role', 'admin');
        if (selectedCashierFilter !== 'all') {
          params.append('cashier', selectedCashierFilter);
        }
        const res = await fetch(`${API_BASE_URL}/api/dashboard?${params.toString()}`);
        if (!res.ok) return mockStats;
        return res.json();
      } catch {
        return mockStats;
      }
    },
    initialData: mockStats,
  });

  // Unique Cashiers list for filtering
  const uniqueCashiers = useMemo(() => {
    const set = new Set<string>();
    staffList.forEach(s => s.name && set.add(s.name));
    ordersList.forEach((o: any) => o.cashierName && set.add(o.cashierName));
    return Array.from(set);
  }, [staffList, ordersList]);

  // Filtered Orders according to cashier filter
  const filteredOrdersList = useMemo(() => {
    if (selectedCashierFilter === 'all') return ordersList;
    const filter = selectedCashierFilter.toLowerCase();
    return ordersList.filter((o: any) =>
      (o.cashierName && o.cashierName.toLowerCase() === filter) ||
      (o.cashierEmail && o.cashierEmail.toLowerCase() === filter)
    );
  }, [ordersList, selectedCashierFilter]);

  // Fetch live products
  const { data: fetchedProducts } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/products`);
        if (!res.ok) return initialProducts;
        const data = await res.json();
        return Array.isArray(data) && data.length > 0 ? data : initialProducts;
      } catch {
        return initialProducts;
      }
    },
    initialData: initialProducts,
  });

  useEffect(() => {
    if (fetchedProducts && fetchedProducts.length > 0) {
      setProductsList(fetchedProducts);
    }
  }, [fetchedProducts]);

  // Fetch live categories
  const { data: fetchedCategories } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/categories`);
        if (!res.ok) return initialCategories;
        const data = await res.json();
        return Array.isArray(data) && data.length > 0 ? data : initialCategories;
      } catch {
        return initialCategories;
      }
    },
    initialData: initialCategories,
  });

  useEffect(() => {
    if (fetchedCategories && fetchedCategories.length > 0) {
      setCategoriesList(fetchedCategories);
    }
  }, [fetchedCategories]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    let list = productsList;
    if (selectedProductCategory !== 'all') {
      list = list.filter(p => p.category === selectedProductCategory || p.categoryId === selectedProductCategory);
    }
    if (productSearch.trim()) {
      const q = productSearch.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q) || (p.barcode && p.barcode.includes(q)));
    }
    return list;
  }, [productsList, selectedProductCategory, productSearch]);

  const handleCreateProduct = async () => {
    if (!newProduct.name.trim() || newProduct.price <= 0) {
      toast.error('Please provide a valid product name and price.');
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/api/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProduct),
      });
      if (res.ok) {
        toast.success(`Product "${newProduct.name}" created successfully!`);
        queryClient.invalidateQueries({ queryKey: ['products'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      }
    } catch {
      setProductsList(prev => [...prev, { ...newProduct, id: Date.now() }]);
      toast.success('Product saved locally');
    }
    setShowAddProductModal(false);
    setNewProduct({ name: '', price: 50, category: 'snacks', subcategory: 'Chips', image: '📦', available: true, stockQuantity: 50, barcode: '' });
  };

  const handleCreateCategory = async () => {
    if (!newCategory.name.trim()) {
      toast.error('Please provide a category name.');
      return;
    }
    const catId = newCategory.id.trim() || newCategory.name.toLowerCase().replace(/\s+/g, '-');
    const subs = newCategory.subcategories ? newCategory.subcategories.split(',').map(s => s.trim()).filter(Boolean) : [];
    try {
      const res = await fetch(`${API_BASE_URL}/api/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: catId, name: newCategory.name, icon: newCategory.icon || '🏪', subcategories: subs }),
      });
      if (res.ok) {
        toast.success(`Category "${newCategory.name}" created!`);
        queryClient.invalidateQueries({ queryKey: ['categories'] });
      }
    } catch {
      setCategoriesList(prev => [...prev, { id: catId, name: newCategory.name, icon: newCategory.icon || '🏪', subcategories: subs }]);
      toast.success('Category saved locally');
    }
    setShowAddCategoryModal(false);
    setNewCategory({ id: '', name: '', icon: '🏪', subcategories: '' });
  };

  const addStockMutation = useMutation({
    mutationFn: async ({ productId, qty }: { productId: number; qty: number }) => {
      const res = await fetch(`${API_BASE_URL}/api/stock/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantityToAdd: qty, reason: 'Restock / Purchase' }),
      });
      if (!res.ok) throw new Error('Stock update failed');
      return res.json();
    },
    onSuccess: (data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Tuck Shop Dashboard</h1>
                <p className="text-muted-foreground text-sm">Real-time overview of counter sales, revenue & stock alerts.</p>
              </div>

              {/* Cashier Filter Dropdown */}
              <div className="flex items-center gap-2 bg-card border px-3 py-2 rounded-xl shadow-sm">
                <Filter className="w-4 h-4 text-primary" />
                <span className="text-xs font-semibold text-muted-foreground">Cashier:</span>
                <select
                  value={selectedCashierFilter}
                  onChange={e => setSelectedCashierFilter(e.target.value)}
                  className="bg-transparent text-xs font-bold text-foreground focus:outline-none cursor-pointer"
                >
                  <option value="all">All Cashiers (Store Consolidated)</option>
                  {uniqueCashiers.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-card rounded-2xl border p-5 space-y-3">
                <div className="flex justify-between items-center text-muted-foreground">
                  <span className="text-xs font-semibold uppercase">
                    {selectedCashierFilter === 'all' ? "Today's Total Sales" : `${selectedCashierFilter}'s Today Sales`}
                  </span>
                  <DollarSign className="w-4 h-4 text-emerald-500" />
                </div>
                <p className="text-2xl font-bold text-gradient-primary">Rs {(dashboardData.todayRevenue ?? 4850).toLocaleString()}</p>
                <div className="flex items-center text-xs text-emerald-500 font-medium">
                  <TrendingUp className="w-3.5 h-3.5 mr-1" /> Counter Sales Today
                </div>
              </div>

              <div className="bg-card rounded-2xl border p-5 space-y-3">
                <div className="flex justify-between items-center text-muted-foreground">
                  <span className="text-xs font-semibold uppercase">Completed Transactions</span>
                  <ShoppingBag className="w-4 h-4 text-primary" />
                </div>
                <p className="text-2xl font-bold">{dashboardData.todayOrderCount ?? dashboardData.totalOrders ?? 42}</p>
                <div className="text-xs text-muted-foreground font-medium">
                  {selectedCashierFilter === 'all' ? 'All Staff Sales' : `By ${selectedCashierFilter}`}
                </div>
              </div>

              <div className="bg-card rounded-2xl border p-5 space-y-3">
                <div className="flex justify-between items-center text-muted-foreground">
                  <span className="text-xs font-semibold uppercase">Low Stock Alerts</span>
                  <AlertTriangle className="w-4 h-4 text-orange-500" />
                </div>
                <p className="text-2xl font-bold text-orange-500">{dashboardData.lowStockCount ?? 3}</p>
                <div className="text-xs text-orange-500 font-medium">Items with &le; 5 stock left</div>
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

            {/* Employee Performance Breakdown Card */}
            {dashboardData.cashierPerformance && dashboardData.cashierPerformance.length > 0 && (
              <div className="bg-card rounded-2xl border p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-base flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-primary" /> Cashier / Employee Sales Breakdown
                  </h3>
                  <span className="text-xs text-muted-foreground">Individual Cashier Performance</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {dashboardData.cashierPerformance.map((cp: any) => (
                    <div
                      key={cp.cashier}
                      onClick={() => setSelectedCashierFilter(cp.cashier === selectedCashierFilter ? 'all' : cp.cashier)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer ${
                        selectedCashierFilter === cp.cashier
                          ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                          : 'bg-muted/30 hover:border-primary/40'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-bold text-sm">{cp.cashier}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
                          {cp.completedOrders ?? cp.totalOrders ?? 0} Sales
                        </span>
                      </div>
                      <p className="text-xl font-bold text-primary">Rs {(cp.totalSales ?? 0).toLocaleString()}</p>
                      {cp.returnedOrders > 0 && (
                        <p className="text-[11px] text-orange-500 mt-1">
                          {cp.returnedOrders} Return(s) processed
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

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
              </div>
            </div>
          </>
        )}

        {/* INVENTORY / PRODUCTS / STOCK TAB */}
        {activeTab === 'inventory' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                  <Boxes className="w-6 h-6 text-primary" /> Inventory & Products
                </h1>
                <p className="text-muted-foreground text-sm">Manage tuck shop items, live stock units & barcodes.</p>
              </div>
              <button
                onClick={() => setShowAddProductModal(true)}
                className="h-11 px-4 rounded-xl gradient-primary text-primary-foreground font-semibold flex items-center gap-2 shadow-soft hover:opacity-90 transition-opacity"
              >
                <Plus className="w-4 h-4" /> Add New Item
              </button>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={productSearch}
                  onChange={e => setProductSearch(e.target.value)}
                  placeholder="Search item name or barcode..."
                  className="w-full h-11 pl-10 pr-4 rounded-xl border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
              <div className="flex gap-2 overflow-x-auto pos-scrollbar pb-1">
                <button
                  onClick={() => setSelectedProductCategory('all')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    selectedProductCategory === 'all'
                      ? 'gradient-primary text-primary-foreground'
                      : 'bg-card border hover:bg-muted text-muted-foreground'
                  }`}
                >
                  All
                </button>
                {categoriesList.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedProductCategory(c.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                      selectedProductCategory === c.id
                        ? 'gradient-primary text-primary-foreground'
                        : 'bg-card border hover:bg-muted text-muted-foreground'
                    }`}
                  >
                    <span>{c.icon}</span>
                    <span>{c.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Products Table / Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProducts.map(p => (
                <div key={p.id} className="bg-card rounded-2xl border p-4 space-y-3 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center text-2xl">
                        {p.image || '📦'}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm">{p.name}</h4>
                        <p className="text-xs text-muted-foreground">{p.subcategory || p.category}</p>
                      </div>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      (p.stockQuantity ?? 0) <= 0
                        ? 'bg-destructive/10 text-destructive'
                        : (p.stockQuantity ?? 0) <= 5
                        ? 'bg-orange-500/10 text-orange-500'
                        : 'bg-emerald-500/10 text-emerald-600'
                    }`}>
                      {(p.stockQuantity ?? 0) <= 0 ? 'Out of Stock' : `${p.stockQuantity} in stock`}
                    </span>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t text-xs">
                    <span className="font-mono text-muted-foreground">{p.barcode || 'No Barcode'}</span>
                    <span className="text-base font-bold text-primary">Rs {p.price}</span>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => {
                        setSelectedStockProduct(p);
                        setShowAddStockModal(true);
                      }}
                      className="flex-1 py-2 rounded-xl border text-xs font-bold hover:bg-accent text-primary transition-colors flex items-center justify-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Stock
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CATEGORIES TAB */}
        {activeTab === 'categories' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                  <FolderTree className="w-6 h-6 text-primary" /> Tuck Shop Categories
                </h1>
                <p className="text-muted-foreground text-sm">Organize snacks, beverages, stationery & dairy sections.</p>
              </div>
              <button
                onClick={() => setShowAddCategoryModal(true)}
                className="h-11 px-4 rounded-xl gradient-primary text-primary-foreground font-semibold flex items-center gap-2 shadow-soft hover:opacity-90 transition-opacity"
              >
                <Plus className="w-4 h-4" /> Add Category
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categoriesList.filter(c => c.id !== 'all').map(cat => (
                <div key={cat.id} className="bg-card rounded-2xl border p-5 space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl p-2.5 rounded-xl bg-accent">{cat.icon}</span>
                    <div>
                      <h3 className="font-bold text-base">{cat.name}</h3>
                      <p className="text-xs text-muted-foreground">{cat.subcategories?.length ?? 0} subcategories</p>
                    </div>
                  </div>

                  {cat.subcategories && cat.subcategories.length > 0 && (
                    <div className="pt-3 border-t">
                      <p className="text-xs text-muted-foreground font-medium mb-2">Subcategories:</p>
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                  <BarChart3 className="w-6 h-6 text-primary" /> Sales & Order History
                </h1>
                <p className="text-muted-foreground text-sm">View counter transactions and process customer returns/refunds.</p>
              </div>

              {/* Cashier Filter */}
              <div className="flex items-center gap-2 bg-card border px-3 py-2 rounded-xl shadow-sm">
                <Filter className="w-4 h-4 text-primary" />
                <span className="text-xs font-semibold text-muted-foreground">Filter Cashier:</span>
                <select
                  value={selectedCashierFilter}
                  onChange={e => setSelectedCashierFilter(e.target.value)}
                  className="bg-transparent text-xs font-bold text-foreground focus:outline-none cursor-pointer"
                >
                  <option value="all">All Cashiers / Staff</option>
                  {uniqueCashiers.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="bg-card rounded-2xl border p-6">
              <div className="space-y-3">
                {filteredOrdersList.length === 0 ? (
                  <p className="text-center py-12 text-sm text-muted-foreground">
                    No orders found {selectedCashierFilter !== 'all' ? `for cashier "${selectedCashierFilter}"` : ''}.
                  </p>
                ) : (
                  filteredOrdersList.map((order: any) => (
                    <div key={order.id} className="flex justify-between items-center p-4 rounded-xl border bg-muted/20 text-sm">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-base">{order.orderNumber}</p>
                          <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                            order.status === 'Returned' ? 'bg-destructive/10 text-destructive' :
                            order.status === 'Partially Returned' ? 'bg-orange-500/10 text-orange-500' :
                            'bg-emerald-500/10 text-emerald-600'
                          }`}>
                            {order.status || 'Completed'}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {new Date(order.createdAt).toLocaleString()} • {order.paymentMethod || 'Cash'} • <span className="font-semibold text-primary">Cashier: {order.cashierName || 'Staff'}</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-bold text-primary text-base">Rs {order.total}</p>
                          <p className="text-xs text-muted-foreground">{order.items?.length ?? order.itemsCount ?? 0} items</p>
                        </div>

                        {order.status !== 'Returned' && order.items && order.items.length > 0 && (
                          <button
                            onClick={() => setSelectedReturnOrder(order)}
                            className="px-3 py-1.5 rounded-xl border border-orange-500/30 text-orange-500 hover:bg-orange-500/10 text-xs font-bold transition-all flex items-center gap-1.5"
                          >
                            <RotateCcw className="w-3.5 h-3.5" /> Return / Refund
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
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
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                  <FileText className="w-6 h-6 text-primary" /> Financial & Sales Reports
                </h1>
                <p className="text-muted-foreground text-sm">Consolidated summaries of counter revenue, inventory turnover and staff sales.</p>
              </div>
              <button
                onClick={() => window.print()}
                className="h-10 px-4 rounded-xl border font-bold text-xs flex items-center gap-2 hover:bg-muted transition-colors"
              >
                <Printer className="w-4 h-4" /> Print Report
              </button>
            </div>

            {/* Reports Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-card rounded-2xl border p-5 space-y-2">
                <span className="text-xs text-muted-foreground uppercase font-semibold">Total Cumulative Sales</span>
                <p className="text-2xl font-bold text-primary">Rs {(dashboardData.todayRevenue ?? 0).toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Today's recorded sales</p>
              </div>
              <div className="bg-card rounded-2xl border p-5 space-y-2">
                <span className="text-xs text-muted-foreground uppercase font-semibold">Monthly Total Revenue</span>
                <p className="text-2xl font-bold text-emerald-600">Rs {(dashboardData.monthlyRevenue ?? 0).toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Month-to-date total</p>
              </div>
              <div className="bg-card rounded-2xl border p-5 space-y-2">
                <span className="text-xs text-muted-foreground uppercase font-semibold">Total Stock Units</span>
                <p className="text-2xl font-bold">
                  {productsList.reduce((s, p) => s + (p.stockQuantity ?? 0), 0)} Units
                </p>
                <p className="text-xs text-muted-foreground">Across {productsList.length} catalog items</p>
              </div>
            </div>

            {/* Cashier Audit Table */}
            <div className="bg-card rounded-2xl border p-6 space-y-4">
              <h3 className="font-bold text-base flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-primary" /> Staff Sales Summary Table
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b bg-muted/40 font-bold uppercase text-muted-foreground">
                    <tr>
                      <th className="p-3">Cashier / Staff</th>
                      <th className="p-3">Role</th>
                      <th className="p-3">Total Sales (Rs)</th>
                      <th className="p-3">Completed Orders</th>
                      <th className="p-3">Returns</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {(dashboardData.cashierPerformance && dashboardData.cashierPerformance.length > 0) ? (
                      dashboardData.cashierPerformance.map((cp: any) => (
                        <tr key={cp.cashier} className="hover:bg-muted/20">
                          <td className="p-3 font-bold">{cp.cashier}</td>
                          <td className="p-3"><span className="px-2 py-0.5 rounded bg-primary/10 text-primary font-semibold uppercase text-[10px]">Cashier</span></td>
                          <td className="p-3 font-bold text-primary">Rs {(cp.totalSales ?? 0).toLocaleString()}</td>
                          <td className="p-3 font-semibold">{cp.completedOrders ?? cp.totalOrders ?? 0}</td>
                          <td className="p-3 text-orange-500 font-semibold">{cp.returnedOrders ?? 0}</td>
                        </tr>
                      ))
                    ) : (
                      staffList.map(s => (
                        <tr key={s.id} className="hover:bg-muted/20">
                          <td className="p-3 font-bold">{s.name}</td>
                          <td className="p-3"><span className="px-2 py-0.5 rounded bg-primary/10 text-primary font-semibold uppercase text-[10px]">{s.role}</span></td>
                          <td className="p-3 font-bold text-primary">Rs 0</td>
                          <td className="p-3 font-semibold">0</td>
                          <td className="p-3 text-orange-500 font-semibold">0</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === 'settings' && (
          <div className="space-y-6 max-w-xl">
            <div>
              <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                <SettingsIcon className="w-6 h-6 text-primary" /> Tuck Shop Settings
              </h1>
              <p className="text-muted-foreground text-sm">Configure GST tax rate, currency and thermal printer settings.</p>
            </div>

            <div className="bg-card rounded-2xl border p-6 space-y-5">
              <div className="space-y-2">
                <label className="font-bold text-sm block">GST / Sales Tax Rate (%)</label>
                <input
                  type="number"
                  value={gstRate}
                  onChange={e => {
                    const rate = Number(e.target.value);
                    setGstRate(rate);
                    setStoredTaxRate(rate);
                  }}
                  className="w-full h-11 px-4 rounded-xl border bg-muted/40 font-bold focus:outline-none"
                />
                <p className="text-xs text-muted-foreground">Set 0% for tax-free tuck shop sales, or enter current applicable rate.</p>
              </div>
              <button
                onClick={() => toast.success('Settings saved!')}
                className="h-11 px-6 rounded-xl gradient-primary text-primary-foreground font-bold text-sm"
              >
                Save Changes
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ADD STOCK MODAL */}
      {showAddStockModal && selectedStockProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 backdrop-blur-sm">
          <div className="bg-card rounded-2xl p-6 w-full max-w-sm border shadow-float space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-lg">Add Stock Units</h3>
              <button onClick={() => setShowAddStockModal(false)} className="p-1 rounded-lg hover:bg-muted">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div>
              <p className="font-bold text-sm">{selectedStockProduct.name}</p>
              <p className="text-xs text-muted-foreground">Current in stock: {selectedStockProduct.stockQuantity ?? 0} units</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">Quantity to Add</label>
              <input
                type="number"
                value={stockAddAmount}
                onChange={e => setStockAddAmount(e.target.value)}
                className="w-full h-12 text-center text-xl font-bold rounded-xl border bg-muted/40 focus:outline-none"
                autoFocus
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

      {/* SALES RETURN MODAL */}
      {selectedReturnOrder && (
        <ReturnModal
          order={selectedReturnOrder}
          cashierName={userName || 'Admin'}
          onClose={() => setSelectedReturnOrder(null)}
          onReturnSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            queryClient.invalidateQueries({ queryKey: ['products'] });
            queryClient.invalidateQueries({ queryKey: ['stock'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
            queryClient.invalidateQueries({ queryKey: ['stock-logs'] });
          }}
        />
      )}
    </AdminSidebar>
  );
};

export default AdminDashboard;
