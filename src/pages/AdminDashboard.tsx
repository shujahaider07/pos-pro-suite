import { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  TrendingUp, TrendingDown, DollarSign, ShoppingBag, BarChart3, Award,
  Plus, Search, Trash2, X, Users, Grid3X3,
  FolderTree, FileText, Settings as SettingsIcon,
  Printer, CreditCard, Banknote, Smartphone
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import AdminSidebar from '@/components/pos/AdminSidebar';
import {
  dashboardStats, initialProducts, initialCategories, initialTables,
  initialStaff, initialOrders, initialSettings,
  type Product, type Category, type TableData, type StaffMember,
  type OrderRecord, type RestaurantSettings
} from '@/lib/mock-data';
import { toast } from 'sonner';

const COLORS = ['hsl(234,89%,56%)', 'hsl(152,69%,40%)', 'hsl(38,92%,50%)', 'hsl(0,72%,56%)', 'hsl(280,60%,55%)'];

const AdminDashboard = () => {
  const location = useLocation();
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000';

  // Products State
  const [productsList, setProductsList] = useState<Product[]>(initialProducts);
  const [productSearch, setProductSearch] = useState('');
  const [selectedProductCategory, setSelectedProductCategory] = useState('all');
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: 350,
    category: 'mains',
    subcategory: 'Chicken',
    image: '🍗',
    available: true,
  });

  // Categories State
  const [categoriesList, setCategoriesList] = useState<Category[]>(initialCategories);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [newCategory, setNewCategory] = useState({ id: '', name: '', icon: '🍽️', subcategories: '' });

  // Tables State
  const [tablesList, setTablesList] = useState<TableData[]>(initialTables);
  const [showAddTableModal, setShowAddTableModal] = useState(false);
  const [newTable, setNewTable] = useState({ name: 'T11', capacity: 4, status: 'available' as const });

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

  // Fetch live backend data if available
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

    fetch(`${API_BASE_URL}/api/tables`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setTablesList(data);
        }
      })
      .catch(() => {});

    fetch(`${API_BASE_URL}/api/orders`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (Array.isArray(data)) {
          setOrdersList(data);
        }
      })
      .catch(() => {});
  }, [API_BASE_URL]);

  // Orders State
  const [ordersList, setOrdersList] = useState<OrderRecord[]>([]);
  const [orderSearch, setOrderSearch] = useState('');
  const [orderFilter, setOrderFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<OrderRecord | null>(null);

  // Settings State
  const [settings, setSettings] = useState<RestaurantSettings>(initialSettings);

  // API query for Dashboard Stats (with fallback)
  const { data: apiDashboard } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/dashboard`);
        if (!response.ok) return dashboardStats;
        return response.json();
      } catch {
        return dashboardStats;
      }
    },
    initialData: dashboardStats,
  });

  const stats = apiDashboard || dashboardStats;

  // Determine current active section from URL
  const currentPath = location.pathname;
  const activeSection = useMemo(() => {
    if (currentPath.includes('/admin/sales') || currentPath.includes('/admin/orders')) return 'sales';
    if (currentPath.includes('/admin/products')) return 'products';
    if (currentPath.includes('/admin/categories')) return 'categories';
    if (currentPath.includes('/admin/tables')) return 'tables';
    if (currentPath.includes('/admin/employees') || currentPath.includes('/admin/staff')) return 'employees';
    if (currentPath.includes('/admin/reports')) return 'reports';
    if (currentPath.includes('/admin/settings')) return 'settings';
    return 'dashboard';
  }, [currentPath]);

  // Product CRUD
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.name) return;
    const item: Product = {
      id: Date.now(),
      name: newProduct.name,
      price: Number(newProduct.price),
      category: newProduct.category,
      categoryId: newProduct.category,
      subcategory: newProduct.subcategory,
      image: newProduct.image || '🍽️',
      available: newProduct.available,
    };
    setProductsList(prev => [item, ...prev]);
    setShowAddProductModal(false);
    setNewProduct({ name: '', price: 350, category: 'mains', subcategory: 'Chicken', image: '🍗', available: true });
    toast.success(`${item.name} added to menu`);

    try {
      await fetch(`${API_BASE_URL}/api/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: item.name,
          price: item.price,
          categoryId: item.categoryId,
          subcategory: item.subcategory,
          image: item.image,
          available: item.available,
        }),
      });
    } catch {}
  };

  const toggleProductStock = async (id: number) => {
    setProductsList(prev =>
      prev.map(p => {
        if (p.id === id) {
          const updated = !p.available;
          toast.info(`${p.name} is now ${updated ? 'In Stock' : 'Out of Stock'}`);
          return { ...p, available: updated };
        }
        return p;
      })
    );
    try {
      await fetch(`${API_BASE_URL}/api/products/${id}/stock`, { method: 'PATCH' });
    } catch {}
  };

  const handleDeleteProduct = async (id: number, name: string) => {
    setProductsList(prev => prev.filter(p => p.id !== id));
    toast.success(`${name} deleted`);
    try {
      await fetch(`${API_BASE_URL}/api/products/${id}`, { method: 'DELETE' });
    } catch {}
  };

  // Category CRUD
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.name) return;
    const catId = newCategory.id || newCategory.name.toLowerCase().replace(/\s+/g, '-');
    const subs = newCategory.subcategories
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
    const cat: Category = {
      id: catId,
      name: newCategory.name,
      icon: newCategory.icon || '🍽️',
      subcategories: subs,
    };
    setCategoriesList(prev => [...prev, cat]);
    setShowAddCategoryModal(false);
    setNewCategory({ id: '', name: '', icon: '🍽️', subcategories: '' });
    toast.success(`Category "${cat.name}" added`);

    try {
      await fetch(`${API_BASE_URL}/api/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: cat.name,
          icon: cat.icon,
          subcategories: newCategory.subcategories,
        }),
      });
    } catch {}
  };

  // Table CRUD
  const handleAddTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTable.name) return;
    const item: TableData = {
      id: Date.now(),
      name: newTable.name,
      capacity: Number(newTable.capacity),
      status: newTable.status,
    };
    setTablesList(prev => [...prev, item]);
    setShowAddTableModal(false);
    setNewTable({ name: `T${tablesList.length + 1}`, capacity: 4, status: 'available' });
    toast.success(`Table "${item.name}" added to floor layout`);

    try {
      await fetch(`${API_BASE_URL}/api/tables`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: item.name,
          capacity: item.capacity,
          status: item.status,
        }),
      });
    } catch {}
  };

  const toggleTableStatus = async (id: number) => {
    let nextStatus: TableData['status'] = 'available';
    setTablesList(prev =>
      prev.map(t => {
        if (t.id === id) {
          nextStatus = t.status === 'available' ? 'occupied' : t.status === 'occupied' ? 'reserved' : 'available';
          return { ...t, status: nextStatus };
        }
        return t;
      })
    );
    toast.info('Table status updated');

    try {
      await fetch(`${API_BASE_URL}/api/tables/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nextStatus),
      });
    } catch {}
  };

  // Staff CRUD
  const handleAddStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaff.name || !newStaff.email) return;
    const member: StaffMember = {
      id: Date.now(),
      name: newStaff.name,
      email: newStaff.email,
      role: newStaff.role,
      phone: newStaff.phone || '+92 300 0000000',
      shift: newStaff.shift,
      status: newStaff.status,
    };
    setStaffList(prev => [...prev, member]);
    setShowAddStaffModal(false);
    setNewStaff({ name: '', email: '', role: 'employee', phone: '', shift: 'Morning', status: 'active' });
    toast.success(`Staff member "${member.name}" added`);
  };

  // Settings Save
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Restaurant settings saved successfully');
  };

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return productsList.filter(p => {
      const matchesCat = selectedProductCategory === 'all' || p.category === selectedProductCategory || p.categoryId === selectedProductCategory;
      const matchesSearch = !productSearch || p.name.toLowerCase().includes(productSearch.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [productsList, selectedProductCategory, productSearch]);

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return ordersList.filter(o => {
      const matchesStatus = orderFilter === 'all' || o.status.toLowerCase() === orderFilter.toLowerCase();
      const matchesSearch =
        !orderSearch ||
        o.orderNumber.toLowerCase().includes(orderSearch.toLowerCase()) ||
        o.tableName.toLowerCase().includes(orderSearch.toLowerCase()) ||
        o.serverName.toLowerCase().includes(orderSearch.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [ordersList, orderFilter, orderSearch]);

  return (
    <AdminSidebar>
      <div className="p-8 max-w-7xl mx-auto space-y-8">
        {/* ========================================================================= */}
        {/* SECTION 1: DASHBOARD OVERVIEW */}
        {/* ========================================================================= */}
        {activeSection === 'dashboard' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            <div>
              <h1 className="text-2xl font-bold mb-1">Executive Dashboard</h1>
              <p className="text-muted-foreground text-sm">Real-time performance, revenue metrics, and sales analysis</p>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
              {[
                { label: "Today's Revenue", value: `Rs. ${stats.todayRevenue.toLocaleString()}`, icon: DollarSign, change: '+12.5%', up: true, gradient: 'gradient-primary' },
                { label: 'Weekly Revenue', value: `Rs. ${stats.weeklyRevenue.toLocaleString()}`, icon: TrendingUp, change: '+8.2%', up: true, gradient: 'gradient-success' },
                { label: 'Monthly Revenue', value: `Rs. ${(stats.monthlyRevenue / 100000).toFixed(1)}L`, icon: BarChart3, change: '+15.3%', up: true, gradient: 'gradient-warning' },
                { label: 'Total Orders', value: stats.totalOrders.toString(), icon: ShoppingBag, change: '+23', up: true, gradient: 'gradient-danger' },
                { label: 'Avg Order Value', value: `Rs. ${stats.avgOrderValue}`, icon: Award, change: '-2.1%', up: false, gradient: 'gradient-primary' },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-card rounded-2xl border p-5 hover:shadow-elevated transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-10 h-10 rounded-xl ${stat.gradient} flex items-center justify-center`}>
                      <stat.icon className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <span className={`text-xs font-semibold flex items-center gap-1 ${stat.up ? 'text-success' : 'text-destructive'}`}>
                      {stat.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {stat.change}
                    </span>
                  </div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                </motion.div>
              ))}
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <div className="lg:col-span-2 bg-card rounded-2xl border p-6">
                <h3 className="font-bold text-base mb-4">Sales Trend (Weekly Performance)</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={stats.salesTrend} barSize={32}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(225,20%,90%)" />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} tickFormatter={v => `Rs. ${v / 1000}k`} />
                    <Tooltip formatter={(value: number) => [`Rs. ${value.toLocaleString()}`, 'Sales']} />
                    <Bar dataKey="sales" fill="hsl(234,89%,56%)" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-card rounded-2xl border p-6">
                <h3 className="font-bold text-base mb-4">Category Share (%)</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={stats.categoryPerformance} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value">
                      {stats.categoryPerformance.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 mt-3">
                  {stats.categoryPerformance.map((cat, i) => (
                    <div key={cat.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span className="text-muted-foreground">{cat.name}</span>
                      </div>
                      <span className="font-bold">{cat.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Top Selling Dishes Table */}
            <div className="bg-card rounded-2xl border p-6">
              <h3 className="font-bold text-base mb-4">Top Selling Menu Items</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-xs uppercase tracking-wider text-muted-foreground">
                      <th className="text-left pb-3 font-semibold">Rank</th>
                      <th className="text-left pb-3 font-semibold">Item Name</th>
                      <th className="text-right pb-3 font-semibold">Quantity Sold</th>
                      <th className="text-right pb-3 font-semibold">Total Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.topItems.map((item, i) => (
                      <tr key={item.name} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="py-3 font-bold text-muted-foreground">{i + 1}</td>
                        <td className="py-3 font-medium">{item.name}</td>
                        <td className="py-3 text-right text-muted-foreground">{item.quantity} orders</td>
                        <td className="py-3 text-right font-bold text-primary">Rs. {item.revenue.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* ========================================================================= */}
        {/* SECTION 2: PRODUCTS MANAGEMENT */}
        {/* ========================================================================= */}
        {activeSection === 'products' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <Package className="w-6 h-6 text-primary" />
                  Menu & Products Management
                </h1>
                <p className="text-muted-foreground text-sm mt-1">Add, edit, adjust prices and manage inventory availability</p>
              </div>
              <button
                onClick={() => setShowAddProductModal(true)}
                className="px-4 py-2.5 rounded-xl gradient-primary text-primary-foreground font-semibold text-xs flex items-center gap-2 shadow-soft hover:opacity-95 transition-opacity"
              >
                <Plus className="w-4 h-4" /> Add New Dish
              </button>
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-col md:flex-row items-center gap-4 bg-card p-4 rounded-2xl border">
              <div className="flex-1 relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={productSearch}
                  onChange={e => setProductSearch(e.target.value)}
                  placeholder="Search products by name..."
                  className="w-full h-10 pl-10 pr-4 rounded-xl border bg-muted/40 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div className="flex gap-2 overflow-x-auto w-full md:w-auto pos-scrollbar pb-1">
                {categoriesList.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedProductCategory(cat.id)}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                      selectedProductCategory === cat.id
                        ? 'gradient-primary text-primary-foreground shadow-soft'
                        : 'bg-muted border text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {cat.icon} {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Products Table */}
            <div className="bg-card rounded-2xl border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 border-b">
                    <tr className="text-xs uppercase tracking-wider text-muted-foreground">
                      <th className="text-left p-4 font-semibold">Dish</th>
                      <th className="text-left p-4 font-semibold">Category</th>
                      <th className="text-left p-4 font-semibold">Subcategory</th>
                      <th className="text-right p-4 font-semibold">Price</th>
                      <th className="text-center p-4 font-semibold">Stock Status</th>
                      <th className="text-right p-4 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map(product => (
                      <tr key={product.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="p-4 flex items-center gap-3">
                          <span className="text-2xl p-2 rounded-xl bg-muted/60">{product.image}</span>
                          <div>
                            <p className="font-semibold text-foreground">{product.name}</p>
                            <p className="text-xs text-muted-foreground">ID: #{product.id}</p>
                          </div>
                        </td>
                        <td className="p-4 uppercase text-xs font-semibold text-muted-foreground">{product.category}</td>
                        <td className="p-4 text-xs text-muted-foreground">{product.subcategory || '-'}</td>
                        <td className="p-4 text-right font-bold text-primary">Rs. {product.price}</td>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => toggleProductStock(product.id)}
                            className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                              product.available
                                ? 'bg-success/10 text-success hover:bg-success/20'
                                : 'bg-destructive/10 text-destructive hover:bg-destructive/20'
                            }`}
                          >
                            {product.available ? 'In Stock' : 'Out of Stock'}
                          </button>
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => handleDeleteProduct(product.id, product.name)}
                            className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                            title="Delete Dish"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* ========================================================================= */}
        {/* SECTION 3: CATEGORIES MANAGEMENT */}
        {/* ========================================================================= */}
        {activeSection === 'categories' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <FolderTree className="w-6 h-6 text-primary" />
                  Menu Categories
                </h1>
                <p className="text-muted-foreground text-sm mt-1">Organize your menu hierarchy and category tags</p>
              </div>
              <button
                onClick={() => setShowAddCategoryModal(true)}
                className="px-4 py-2.5 rounded-xl gradient-primary text-primary-foreground font-semibold text-xs flex items-center gap-2 shadow-soft hover:opacity-95"
              >
                <Plus className="w-4 h-4" /> Add Category
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {categoriesList.map(cat => {
                const count = productsList.filter(p => p.category === cat.id || p.categoryId === cat.id).length;
                return (
                  <div key={cat.id} className="bg-card rounded-2xl border p-5 hover:shadow-elevated transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl p-2.5 rounded-xl bg-muted/60">{cat.icon}</span>
                        <div>
                          <h3 className="font-bold text-base">{cat.name}</h3>
                          <span className="text-xs text-muted-foreground">{count} items linked</span>
                        </div>
                      </div>
                    </div>
                    {cat.subcategories && cat.subcategories.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t">
                        {cat.subcategories.map(sub => (
                          <span key={sub} className="px-2.5 py-1 rounded-lg bg-muted text-[11px] font-medium text-muted-foreground">
                            {sub}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ========================================================================= */}
        {/* SECTION 4: TABLES MANAGEMENT */}
        {/* ========================================================================= */}
        {activeSection === 'tables' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <Grid3X3 className="w-6 h-6 text-primary" />
                  Floor Layout & Tables
                </h1>
                <p className="text-muted-foreground text-sm mt-1">Manage dining areas, seat counts, and status overrides</p>
              </div>
              <button
                onClick={() => setShowAddTableModal(true)}
                className="px-4 py-2.5 rounded-xl gradient-primary text-primary-foreground font-semibold text-xs flex items-center gap-2 shadow-soft hover:opacity-95"
              >
                <Plus className="w-4 h-4" /> Add Table
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {tablesList.map(table => (
                <div key={table.id} className="bg-card rounded-2xl border-2 p-5 text-left hover:shadow-elevated transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xl font-bold">{table.name}</h3>
                    <span className="text-xs text-muted-foreground font-medium">{table.capacity} Seats</span>
                  </div>
                  <div className="space-y-3">
                    <button
                      onClick={() => toggleTableStatus(table.id)}
                      className={`w-full py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                        table.status === 'available'
                          ? 'bg-success/10 text-success'
                          : table.status === 'occupied'
                          ? 'bg-warning/10 text-warning'
                          : 'bg-primary/10 text-primary'
                      }`}
                    >
                      {table.status}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ========================================================================= */}
        {/* SECTION 5: ORDERS & SALES HISTORY */}
        {/* ========================================================================= */}
        {activeSection === 'sales' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <BarChart3 className="w-6 h-6 text-primary" />
                Orders & Sales History
              </h1>
              <p className="text-muted-foreground text-sm mt-1">Audit complete dining receipts, timestamps, and payment breakdown</p>
            </div>

            {/* Filter */}
            <div className="flex flex-col sm:flex-row items-center gap-4 bg-card p-4 rounded-2xl border">
              <div className="flex-1 relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={orderSearch}
                  onChange={e => setOrderSearch(e.target.value)}
                  placeholder="Search by order #, table name, or server..."
                  className="w-full h-10 pl-10 pr-4 rounded-xl border bg-muted/40 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div className="flex gap-2">
                {['all', 'completed', 'active', 'held', 'cancelled'].map(f => (
                  <button
                    key={f}
                    onClick={() => setOrderFilter(f)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                      orderFilter === f
                        ? 'gradient-primary text-primary-foreground shadow-soft'
                        : 'bg-muted text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Table */}
            <div className="bg-card rounded-2xl border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 border-b">
                    <tr className="text-xs uppercase tracking-wider text-muted-foreground">
                      <th className="text-left p-4 font-semibold">Order ID</th>
                      <th className="text-left p-4 font-semibold">Table</th>
                      <th className="text-left p-4 font-semibold">Server</th>
                      <th className="text-left p-4 font-semibold">Time</th>
                      <th className="text-center p-4 font-semibold">Method</th>
                      <th className="text-center p-4 font-semibold">Status</th>
                      <th className="text-right p-4 font-semibold">Total Amount</th>
                      <th className="text-right p-4 font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-12 text-center text-muted-foreground">
                          <p className="text-base font-semibold text-foreground mb-1">No Orders Found</p>
                          <p className="text-xs text-muted-foreground">Orders placed from POS Tables will appear here in real-time from the database.</p>
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map(order => (
                        <tr key={order.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                          <td className="p-4 font-bold text-foreground">{order.orderNumber}</td>
                          <td className="p-4 font-medium">{order.tableName}</td>
                          <td className="p-4 text-muted-foreground">{order.serverName}</td>
                          <td className="p-4 text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                          <td className="p-4 text-center">
                            <span className="px-2.5 py-1 rounded-lg bg-muted text-xs uppercase font-semibold">
                              {order.paymentMethod}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-bold ${
                                order.status === 'Completed'
                                  ? 'bg-success/10 text-success'
                                  : order.status === 'Active'
                                  ? 'bg-warning/10 text-warning'
                                  : 'bg-muted text-muted-foreground'
                              }`}
                            >
                              {order.status}
                            </span>
                          </td>
                          <td className="p-4 text-right font-bold text-primary">Rs. {order.total.toLocaleString()}</td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => setSelectedOrder(order)}
                              className="px-3 py-1.5 rounded-lg border text-xs font-semibold hover:bg-muted transition-colors"
                            >
                              View Receipt
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* ========================================================================= */}
        {/* SECTION 6: EMPLOYEES & STAFF */}
        {/* ========================================================================= */}
        {activeSection === 'employees' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <Users className="w-6 h-6 text-primary" />
                  Staff & Role Permissions
                </h1>
                <p className="text-muted-foreground text-sm mt-1">Manage POS users, cashiers, waitstaff, and manager roles</p>
              </div>
              <button
                onClick={() => setShowAddStaffModal(true)}
                className="px-4 py-2.5 rounded-xl gradient-primary text-primary-foreground font-semibold text-xs flex items-center gap-2 shadow-soft hover:opacity-95"
              >
                <Plus className="w-4 h-4" /> Add Team Member
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {staffList.map(member => (
                <div key={member.id} className="bg-card rounded-2xl border p-5 hover:shadow-elevated transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center text-primary-foreground text-lg font-bold">
                      {member.name.charAt(0)}
                    </div>
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase ${
                      member.role === 'admin' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                    }`}>
                      {member.role}
                    </span>
                  </div>
                  <h3 className="font-bold text-base">{member.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{member.email}</p>
                  <div className="mt-4 pt-3 border-t space-y-1.5 text-xs text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Phone:</span>
                      <span className="font-medium text-foreground">{member.phone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shift:</span>
                      <span className="font-medium text-foreground">{member.shift}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ========================================================================= */}
        {/* SECTION 7: REPORTS & ANALYTICS */}
        {/* ========================================================================= */}
        {activeSection === 'reports' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <FileText className="w-6 h-6 text-primary" />
                Financial Reports & Audit
              </h1>
              <p className="text-muted-foreground text-sm mt-1">Exportable statements, tax summaries, and tender distribution</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="bg-card rounded-2xl border p-6">
                <h3 className="font-bold text-base mb-2">Payment Tenders</h3>
                <p className="text-xs text-muted-foreground mb-4">Distribution by payment channel</p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-muted-foreground"><Banknote className="w-4 h-4 text-success" /> Cash</span>
                    <span className="font-bold">42% (Rs. 20,400)</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-muted-foreground"><CreditCard className="w-4 h-4 text-primary" /> Card</span>
                    <span className="font-bold">38% (Rs. 18,500)</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-muted-foreground"><Smartphone className="w-4 h-4 text-warning" /> QR / UPI</span>
                    <span className="font-bold">20% (Rs. 9,850)</span>
                  </div>
                </div>
              </div>

              <div className="bg-card rounded-2xl border p-6">
                <h3 className="font-bold text-base mb-2">Tax & Service Charges</h3>
                <p className="text-xs text-muted-foreground mb-4">Accumulated tax for current cycle</p>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">GST / Sales Tax (5%)</span>
                    <span className="font-bold">Rs. 2,437</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Service Charge (2%)</span>
                    <span className="font-bold">Rs. 975</span>
                  </div>
                  <div className="flex justify-between text-sm border-t pt-2 font-bold">
                    <span>Total Levies</span>
                    <span className="text-primary">Rs. 3,412</span>
                  </div>
                </div>
              </div>

              <div className="bg-card rounded-2xl border p-6 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-base mb-2">Export Statements</h3>
                  <p className="text-xs text-muted-foreground mb-4">Download PDF / Excel summaries for accounting</p>
                </div>
                <div className="space-y-2">
                  <button
                    onClick={() => toast.success('Daily Sales Report exported')}
                    className="w-full py-2.5 rounded-xl gradient-primary text-primary-foreground font-semibold text-xs shadow-soft"
                  >
                    Download Today's PDF
                  </button>
                  <button
                    onClick={() => toast.success('Monthly Ledger exported')}
                    className="w-full py-2.5 rounded-xl border text-xs font-semibold hover:bg-muted"
                  >
                    Export Monthly Excel
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ========================================================================= */}
        {/* SECTION 8: SETTINGS */}
        {/* ========================================================================= */}
        {activeSection === 'settings' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <SettingsIcon className="w-6 h-6 text-primary" />
                POS & Restaurant Settings
              </h1>
              <p className="text-muted-foreground text-sm mt-1">Configure restaurant details, currency, tax rates, and hardware</p>
            </div>

            <form onSubmit={handleSaveSettings} className="bg-card rounded-2xl border p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Restaurant Name</label>
                  <input
                    type="text"
                    value={settings.restaurantName}
                    onChange={e => setSettings({ ...settings, restaurantName: e.target.value })}
                    className="w-full h-11 px-4 rounded-xl border bg-muted/40 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Tagline</label>
                  <input
                    type="text"
                    value={settings.tagline}
                    onChange={e => setSettings({ ...settings, tagline: e.target.value })}
                    className="w-full h-11 px-4 rounded-xl border bg-muted/40 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Contact Phone</label>
                  <input
                    type="text"
                    value={settings.phone}
                    onChange={e => setSettings({ ...settings, phone: e.target.value })}
                    className="w-full h-11 px-4 rounded-xl border bg-muted/40 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Email Address</label>
                  <input
                    type="email"
                    value={settings.email}
                    onChange={e => setSettings({ ...settings, email: e.target.value })}
                    className="w-full h-11 px-4 rounded-xl border bg-muted/40 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Physical Address</label>
                  <input
                    type="text"
                    value={settings.address}
                    onChange={e => setSettings({ ...settings, address: e.target.value })}
                    className="w-full h-11 px-4 rounded-xl border bg-muted/40 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Tax Rate (%)</label>
                  <input
                    type="number"
                    value={settings.taxRate}
                    onChange={e => setSettings({ ...settings, taxRate: Number(e.target.value) })}
                    className="w-full h-11 px-4 rounded-xl border bg-muted/40 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Service Charge (%)</label>
                  <input
                    type="number"
                    value={settings.serviceChargeRate}
                    onChange={e => setSettings({ ...settings, serviceChargeRate: Number(e.target.value) })}
                    className="w-full h-11 px-4 rounded-xl border bg-muted/40 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>

              <div className="pt-4 border-t flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl gradient-primary text-primary-foreground font-semibold text-sm shadow-soft hover:opacity-95"
                >
                  Save Configuration
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODALS */}
      {/* ========================================================================= */}

      {/* Add Product Modal */}
      {showAddProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowAddProductModal(false)}>
          <div className="bg-card rounded-2xl w-[420px] shadow-float p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">Add New Dish</h3>
              <button onClick={() => setShowAddProductModal(false)} className="p-1 rounded-lg hover:bg-muted"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleAddProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-bold mb-1 text-muted-foreground">Dish Name</label>
                <input
                  type="text"
                  required
                  value={newProduct.name}
                  onChange={e => setNewProduct({ ...newProduct, name: e.target.value })}
                  placeholder="e.g. Chicken Biryani"
                  className="w-full h-10 px-3 rounded-xl border bg-muted/40 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold mb-1 text-muted-foreground">Price (Rs.)</label>
                  <input
                    type="number"
                    required
                    value={newProduct.price}
                    onChange={e => setNewProduct({ ...newProduct, price: Number(e.target.value) })}
                    className="w-full h-10 px-3 rounded-xl border bg-muted/40 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1 text-muted-foreground">Emoji Icon</label>
                  <input
                    type="text"
                    value={newProduct.image}
                    onChange={e => setNewProduct({ ...newProduct, image: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border bg-muted/40 text-sm text-center"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold mb-1 text-muted-foreground">Category</label>
                <select
                  value={newProduct.category}
                  onChange={e => setNewProduct({ ...newProduct, category: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl border bg-muted/40 text-sm"
                >
                  {categoriesList.filter(c => c.id !== 'all').map(c => (
                    <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                  ))}
                </select>
              </div>
              <button type="submit" className="w-full mt-2 h-11 rounded-xl gradient-primary text-primary-foreground font-semibold text-sm shadow-soft">
                Save Product
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {showAddCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowAddCategoryModal(false)}>
          <div className="bg-card rounded-2xl w-[400px] shadow-float p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">Add Menu Category</h3>
              <button onClick={() => setShowAddCategoryModal(false)} className="p-1 rounded-lg hover:bg-muted"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleAddCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-bold mb-1 text-muted-foreground">Category Name</label>
                <input
                  type="text"
                  required
                  value={newCategory.name}
                  onChange={e => setNewCategory({ ...newCategory, name: e.target.value })}
                  placeholder="e.g. Pasta"
                  className="w-full h-10 px-3 rounded-xl border bg-muted/40 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1 text-muted-foreground">Icon Emoji</label>
                <input
                  type="text"
                  value={newCategory.icon}
                  onChange={e => setNewCategory({ ...newCategory, icon: e.target.value })}
                  placeholder="🍝"
                  className="w-full h-10 px-3 rounded-xl border bg-muted/40 text-sm text-center"
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1 text-muted-foreground">Subcategories (comma separated)</label>
                <input
                  type="text"
                  value={newCategory.subcategories}
                  onChange={e => setNewCategory({ ...newCategory, subcategories: e.target.value })}
                  placeholder="e.g. Alfredo, Arrabbiata, Lasagna"
                  className="w-full h-10 px-3 rounded-xl border bg-muted/40 text-sm"
                />
              </div>
              <button type="submit" className="w-full mt-2 h-11 rounded-xl gradient-primary text-primary-foreground font-semibold text-sm shadow-soft">
                Save Category
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add Table Modal */}
      {showAddTableModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowAddTableModal(false)}>
          <div className="bg-card rounded-2xl w-[380px] shadow-float p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">Add Floor Table</h3>
              <button onClick={() => setShowAddTableModal(false)} className="p-1 rounded-lg hover:bg-muted"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleAddTable} className="space-y-4">
              <div>
                <label className="block text-xs font-bold mb-1 text-muted-foreground">Table Label / Name</label>
                <input
                  type="text"
                  required
                  value={newTable.name}
                  onChange={e => setNewTable({ ...newTable, name: e.target.value })}
                  placeholder="e.g. T11 or VIP-1"
                  className="w-full h-10 px-3 rounded-xl border bg-muted/40 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1 text-muted-foreground">Seating Capacity</label>
                <input
                  type="number"
                  required
                  value={newTable.capacity}
                  onChange={e => setNewTable({ ...newTable, capacity: Number(e.target.value) })}
                  className="w-full h-10 px-3 rounded-xl border bg-muted/40 text-sm"
                />
              </div>
              <button type="submit" className="w-full mt-2 h-11 rounded-xl gradient-primary text-primary-foreground font-semibold text-sm shadow-soft">
                Add Table
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add Staff Modal */}
      {showAddStaffModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowAddStaffModal(false)}>
          <div className="bg-card rounded-2xl w-[400px] shadow-float p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">Add Team Member</h3>
              <button onClick={() => setShowAddStaffModal(false)} className="p-1 rounded-lg hover:bg-muted"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleAddStaff} className="space-y-4">
              <div>
                <label className="block text-xs font-bold mb-1 text-muted-foreground">Full Name</label>
                <input
                  type="text"
                  required
                  value={newStaff.name}
                  onChange={e => setNewStaff({ ...newStaff, name: e.target.value })}
                  placeholder="e.g. Ali Khan"
                  className="w-full h-10 px-3 rounded-xl border bg-muted/40 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1 text-muted-foreground">Email</label>
                <input
                  type="email"
                  required
                  value={newStaff.email}
                  onChange={e => setNewStaff({ ...newStaff, email: e.target.value })}
                  placeholder="ali@resto.com"
                  className="w-full h-10 px-3 rounded-xl border bg-muted/40 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold mb-1 text-muted-foreground">Role</label>
                  <select
                    value={newStaff.role}
                    onChange={e => setNewStaff({ ...newStaff, role: e.target.value as any })}
                    className="w-full h-10 px-3 rounded-xl border bg-muted/40 text-sm"
                  >
                    <option value="employee">Staff / Waiter</option>
                    <option value="cashier">Cashier</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1 text-muted-foreground">Shift</label>
                  <select
                    value={newStaff.shift}
                    onChange={e => setNewStaff({ ...newStaff, shift: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border bg-muted/40 text-sm"
                  >
                    <option value="Morning">Morning</option>
                    <option value="Evening">Evening</option>
                    <option value="Night">Night</option>
                  </select>
                </div>
              </div>
              <button type="submit" className="w-full mt-2 h-11 rounded-xl gradient-primary text-primary-foreground font-semibold text-sm shadow-soft">
                Save Member
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Order Details Receipt Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setSelectedOrder(null)}>
          <div className="bg-card rounded-2xl w-[380px] shadow-float p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">Order Receipt</h3>
              <button onClick={() => setSelectedOrder(null)} className="p-1 rounded-lg hover:bg-muted"><X className="w-4 h-4" /></button>
            </div>
            <div className="border rounded-xl p-4 bg-muted/20 font-mono text-sm space-y-3">
              <div className="text-center border-b pb-3">
                <p className="font-bold text-base">🍽️ RestoPOS</p>
                <p className="text-xs text-muted-foreground">{selectedOrder.orderNumber}</p>
              </div>
              <div className="flex justify-between text-xs">
                <span>Table: <strong>{selectedOrder.tableName}</strong></span>
                <span>Server: <strong>{selectedOrder.serverName}</strong></span>
              </div>
              <div className="border-t pt-2 space-y-1.5">
                {selectedOrder.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-xs">
                    <span>{item.quantity}x {item.productName}</span>
                    <span>Rs. {item.price * item.quantity}</span>
                  </div>
                ))}
              </div>
              <div className="border-t pt-2 flex justify-between font-bold text-sm">
                <span>Total Amount</span>
                <span>Rs. {selectedOrder.total.toLocaleString()}</span>
              </div>
            </div>
            <button
              onClick={() => {
                toast.success('Receipt sent to thermal printer');
                setSelectedOrder(null);
              }}
              className="w-full mt-4 h-11 rounded-xl gradient-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 shadow-soft"
            >
              <Printer className="w-4 h-4" /> Print Receipt
            </button>
          </div>
        </div>
      )}
    </AdminSidebar>
  );
};

export default AdminDashboard;

