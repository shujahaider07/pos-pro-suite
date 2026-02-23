import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { DollarSign, ShoppingBag, Award } from 'lucide-react';
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

const COLORS = ['hsl(234,89%,56%)', 'hsl(152,69%,40%)', 'hsl(38,92%,50%)', 'hsl(0,72%,56%)', 'hsl(280,60%,55%)'];

const AdminSales = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000';

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
      <div className="p-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold mb-1">Sales Analytics</h1>
          <p className="text-muted-foreground text-sm mb-8">
            Sales trend, top items aur category performance ka detailed view
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-5 mb-8">
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-8">
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

        <div className="bg-card rounded-2xl border p-6">
          <h3 className="font-semibold mb-4">Top Selling Items</h3>
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
                    <td className="py-2 text-right text-muted-foreground">{item.quantity}</td>
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

