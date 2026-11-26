import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { DollarSign, ShoppingBag, Award, FolderTree, Package, TrendingUp } from 'lucide-react';
import AdminSidebar from '@/components/pos/AdminSidebar';

interface DashboardStats {
  todayRevenue: number;
  weeklyRevenue: number;
  monthlyRevenue: number;
  totalOrders: number;
  avgOrderValue: number;
  topItems: { name: string; quantity: number; revenue: number }[];
  salesTrend: { day: string; sales: number }[];
  categoryPerformance: { name: string; value: number }[];
}

interface OrderHistoryItem {
  productName: string;
  categoryId: string;
  quantity: number;
  unitPrice: number;
}

interface OrderReportItem {
  id: number;
  orderNumber: string;
  tableName: string;
  status: string;
  createdAt: string;
  totalAmount: number;
  createdBy?: string | null;
  itemsCount?: number;
  items?: OrderHistoryItem[];
}

const COLORS = ['hsl(234,89%,56%)', 'hsl(152,69%,40%)', 'hsl(38,92%,50%)', 'hsl(0,72%,56%)', 'hsl(280,60%,55%)'];

const AdminSales = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000';
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const { data, isLoading, isError } = useQuery<DashboardStats>({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/api/dashboard`);
      if (!response.ok) {
        throw new Error('Failed to load sales analytics');
      }
      return response.json();
    },
  });

  const { data: orderHistory = [] } = useQuery<OrderReportItem[]>({
    queryKey: ['order-history', 30],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/api/orders/history?days=30`);
      if (!response.ok) return [];
      return response.json();
    },
  });

  const { data: categories = [] } = useQuery<{ id: string; name: string; icon?: string }[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/api/categories`);
      if (!response.ok) return [];
      return response.json();
    },
  });

  // Calculate detailed category-wise sales
  const categorySalesData = useMemo(() => {
    const catMap = new Map<string, {
      id: string;
      name: string;
      totalQuantity: number;
      totalRevenue: number;
      items: Map<string, { name: string; quantity: number; revenue: number; unitPrice: number }>;
    }>();

    for (const order of orderHistory) {
      if (order.status === 'Cancelled') continue;
      for (const item of order.items ?? []) {
        const catId = item.categoryId || 'other';
        const matchedCategory = categories.find(c => c.id.toLowerCase() === catId.toLowerCase());
        const catName = matchedCategory ? matchedCategory.name : (catId.charAt(0).toUpperCase() + catId.slice(1));

        if (!catMap.has(catId)) {
          catMap.set(catId, {
            id: catId,
            name: catName,
            totalQuantity: 0,
            totalRevenue: 0,
            items: new Map(),
          });
        }

        const catData = catMap.get(catId)!;
        catData.totalQuantity += item.quantity;
        catData.totalRevenue += item.quantity * item.unitPrice;

        const existingItem = catData.items.get(item.productName) ?? {
          name: item.productName,
          quantity: 0,
          revenue: 0,
          unitPrice: item.unitPrice,
        };
        existingItem.quantity += item.quantity;
        existingItem.revenue += item.quantity * item.unitPrice;
        catData.items.set(item.productName, existingItem);
      }
    }

    return Array.from(catMap.values()).sort((a, b) => b.totalRevenue - a.totalRevenue);
  }, [orderHistory, categories]);

  // Selected Category View
  const activeCategoryData = useMemo(() => {
    if (selectedCategory === 'all') {
      const totalQty = categorySalesData.reduce((s, c) => s + c.totalQuantity, 0);
      const totalRev = categorySalesData.reduce((s, c) => s + c.totalRevenue, 0);
      const allItemsMap = new Map<string, { name: string; quantity: number; revenue: number; unitPrice: number; categoryName: string }>();

      for (const cat of categorySalesData) {
        for (const [prodName, item] of cat.items) {
          const existing = allItemsMap.get(prodName) ?? { ...item, categoryName: cat.name };
          existing.quantity += item.quantity;
          existing.revenue += item.revenue;
          allItemsMap.set(prodName, existing);
        }
      }

      return {
        name: 'All Categories',
        totalQuantity: totalQty,
        totalRevenue: totalRev,
        items: Array.from(allItemsMap.values()).sort((a, b) => b.quantity - a.quantity),
      };
    }

    const found = categorySalesData.find(c => c.id.toLowerCase() === selectedCategory.toLowerCase());
    if (found) {
      return {
        name: found.name,
        totalQuantity: found.totalQuantity,
        totalRevenue: found.totalRevenue,
        items: Array.from(found.items.values()).sort((a, b) => b.quantity - a.quantity),
      };
    }

    return {
      name: selectedCategory,
      totalQuantity: 0,
      totalRevenue: 0,
      items: [],
    };
  }, [categorySalesData, selectedCategory]);

  if (isLoading) {
    return (
      <AdminSidebar>
        <div className="p-8 text-muted-foreground">Loading sales analytics...</div>
      </AdminSidebar>
    );
  }

  if (isError || !data) {
    return (
      <AdminSidebar>
        <div className="p-8 text-destructive">Failed to load sales analytics</div>
      </AdminSidebar>
    );
  }

  const stats = data;

  const kpiCards = [
    { label: 'Today Revenue', value: `₨${stats.todayRevenue.toLocaleString()}`, icon: DollarSign },
    { label: 'This Week Revenue', value: `₨${stats.weeklyRevenue.toLocaleString()}`, icon: DollarSign },
    { label: 'This Month Revenue', value: `₨${stats.monthlyRevenue.toLocaleString()}`, icon: DollarSign },
    { label: 'Total Orders', value: stats.totalOrders.toString(), icon: ShoppingBag },
    { label: 'Avg Order Value', value: `₨${stats.avgOrderValue}`, icon: Award },
  ];

  return (
    <AdminSidebar>
      <div className="p-8 space-y-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold mb-1">Sales Analytics</h1>
          <p className="text-muted-foreground text-sm">
            Sales trend, top items aur category performance ka detailed view
          </p>
        </motion.div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-5">
          {kpiCards.map(card => (
            <div key={card.label} className="bg-card rounded-2xl border p-4 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{card.label}</span>
                <div className="w-8 h-8 rounded-xl gradient-primary flex items-center justify-center">
                  <card.icon className="w-4 h-4 text-primary-foreground" />
                </div>
              </div>
              <p className="text-lg font-bold">{card.value}</p>
            </div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 bg-card rounded-2xl border p-6">
            <h3 className="font-semibold mb-4">Weekly Sales Trend</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={stats.salesTrend} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(225,20%,90%)" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12 }}
                  tickFormatter={v => `₨${(v / 1000).toFixed(1)}k`}
                />
                <Tooltip formatter={(value: number) => [`₨${value.toLocaleString()}`, 'Sales']} />
                <Bar dataKey="sales" fill="hsl(234,89%,56%)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-card rounded-2xl border p-6">
            <h3 className="font-semibold mb-4">Category Performance</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={stats.categoryPerformance}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {stats.categoryPerformance.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-1.5 mt-2">
              {stats.categoryPerformance.map((cat, i) => (
                <div key={cat.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                    <span className="text-muted-foreground">{cat.name}</span>
                  </div>
                  <span className="font-medium">{cat.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Category-Wise Sales Explorer */}
        <div className="bg-card rounded-2xl border p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
            <div>
              <div className="flex items-center gap-2">
                <FolderTree className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-lg">Category-Wise Sales</h3>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Category select karein taake pata chalay kitne items sell hue aur kitna revenue bana
              </p>
            </div>

            {/* Category Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground">Category:</span>
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="h-10 rounded-xl border-2 border-primary/20 bg-background px-3 py-1 text-sm font-semibold text-foreground focus:outline-none focus:border-primary shadow-sm min-w-[180px]"
              >
                <option value="all">🍽️ All Categories</option>
                {categorySalesData.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    📁 {cat.name} ({cat.totalQuantity} sold)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Selected Category KPI Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-muted/40 rounded-xl p-4 border flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Selected Category</p>
                <p className="text-lg font-bold text-foreground mt-0.5">{activeCategoryData.name}</p>
              </div>
              <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center">
                <FolderTree className="w-4 h-4 text-primary-foreground" />
              </div>
            </div>

            <div className="bg-muted/40 rounded-xl p-4 border flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Total Items Sold</p>
                <p className="text-2xl font-black text-primary mt-0.5">
                  {activeCategoryData.totalQuantity} <span className="text-xs font-normal text-muted-foreground">units</span>
                </p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <Package className="w-4 h-4" />
              </div>
            </div>

            <div className="bg-muted/40 rounded-xl p-4 border flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Category Revenue</p>
                <p className="text-2xl font-black text-foreground mt-0.5">
                  ₨{activeCategoryData.totalRevenue.toLocaleString()}
                </p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Product Items Breakdown Table */}
          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50 text-xs text-muted-foreground">
                  <th className="py-3 px-4 text-left">#</th>
                  <th className="py-3 px-4 text-left">Item Name</th>
                  {selectedCategory === 'all' && (
                    <th className="py-3 px-4 text-left">Category</th>
                  )}
                  <th className="py-3 px-4 text-right font-bold text-foreground">Quantity Sold</th>
                  <th className="py-3 px-4 text-right">Avg Unit Price</th>
                  <th className="py-3 px-4 text-right">Total Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {activeCategoryData.items.map((item, index) => (
                  <tr key={item.name} className="hover:bg-muted/30 transition-colors">
                    <td className="py-2.5 px-4 text-muted-foreground text-xs">{index + 1}</td>
                    <td className="py-2.5 px-4 font-semibold">{item.name}</td>
                    {selectedCategory === 'all' && (
                      <td className="py-2.5 px-4 text-xs text-muted-foreground">
                        <span className="px-2 py-0.5 bg-muted rounded-full font-medium">
                          {(item as { categoryName?: string }).categoryName || 'Other'}
                        </span>
                      </td>
                    )}
                    <td className="py-2.5 px-4 text-right">
                      <span className="inline-block px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-black text-sm">
                        {item.quantity} sold
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right text-muted-foreground">
                      ₨{item.unitPrice.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-4 text-right font-bold text-foreground">
                      ₨{item.revenue.toLocaleString()}
                    </td>
                  </tr>
                ))}
                {!activeCategoryData.items.length && (
                  <tr>
                    <td
                      colSpan={selectedCategory === 'all' ? 6 : 5}
                      className="py-8 text-center text-sm text-muted-foreground"
                    >
                      Is category ke abhi tak koi items sell nahi hue.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Overall Top Selling Items */}
        <div className="bg-card rounded-2xl border p-6">
          <h3 className="font-semibold mb-4">Overall Top Selling Items</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-xs text-muted-foreground">
                  <th className="py-2 text-left">#</th>
                  <th className="py-2 text-left">Item</th>
                  <th className="py-2 text-right">Qty Sold</th>
                  <th className="py-2 text-right">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {stats.topItems.map((item, index) => (
                  <tr key={item.name} className="border-b last:border-0">
                    <td className="py-2 text-muted-foreground">{index + 1}</td>
                    <td className="py-2 font-medium">{item.name}</td>
                    <td className="py-2 text-right text-muted-foreground font-bold">{item.quantity}</td>
                    <td className="py-2 text-right font-semibold">₨{item.revenue.toLocaleString()}</td>
                  </tr>
                ))}
                {!stats.topItems.length && (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-sm text-muted-foreground">
                      Abhi tak koi completed orders nahi hain.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminSidebar>
  );
};

export default AdminSales;

