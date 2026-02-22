import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, DollarSign, ShoppingBag, BarChart3, Award } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useQuery } from '@tanstack/react-query';
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

const AdminDashboard = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000';

  const { data, isLoading, isError } = useQuery<DashboardStats>({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/api/dashboard`);
      if (!response.ok) {
        throw new Error('Failed to load dashboard');
      }
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <AdminSidebar>
        <div className="p-8 text-muted-foreground">Loading dashboard...</div>
      </AdminSidebar>
    );
  }

  if (isError || !data) {
    return (
      <AdminSidebar>
        <div className="p-8 text-destructive">Failed to load dashboard data</div>
      </AdminSidebar>
    );
  }

  const dashboardStats = data;

  const statCards = [
    { label: "Today's Revenue", value: `₨${dashboardStats.todayRevenue.toLocaleString()}`, icon: DollarSign, change: '+12.5%', up: true, gradient: 'gradient-primary' },
    { label: 'Weekly Revenue', value: `₨${dashboardStats.weeklyRevenue.toLocaleString()}`, icon: TrendingUp, change: '+8.2%', up: true, gradient: 'gradient-success' },
    { label: 'Monthly Revenue', value: `₨${dashboardStats.monthlyRevenue.toLocaleString()}`, icon: BarChart3, change: '+15.3%', up: true, gradient: 'gradient-warning' },
    { label: 'Total Orders', value: dashboardStats.totalOrders.toString(), icon: ShoppingBag, change: '+23', up: true, gradient: 'gradient-danger' },
    { label: 'Avg Order Value', value: `₨${dashboardStats.avgOrderValue}`, icon: Award, change: '-2.1%', up: false, gradient: 'gradient-primary' },
  ];
  return (
    <AdminSidebar>
      <div className="p-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold mb-1">Dashboard</h1>
          <p className="text-muted-foreground text-sm mb-8">Overview of your restaurant performance</p>
        </motion.div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5 mb-8">
          {statCards.map((stat, i) => (
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

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-2 bg-card rounded-2xl border p-6"
          >
            <h3 className="font-bold mb-4">Sales Trend (This Week)</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={dashboardStats.salesTrend} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(225,20%,90%)" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} tickFormatter={v => `₨${v / 1000}k`} />
                <Tooltip formatter={(value: number) => [`₨${value.toLocaleString()}`, 'Sales']} />
                <Bar dataKey="sales" fill="hsl(234,89%,56%)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="bg-card rounded-2xl border p-6"
          >
            <h3 className="font-bold mb-4">Category Performance</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={dashboardStats.categoryPerformance} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value">
                  {dashboardStats.categoryPerformance.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-1.5 mt-2">
              {dashboardStats.categoryPerformance.map((cat, i) => (
                <div key={cat.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                    <span className="text-muted-foreground">{cat.name}</span>
                  </div>
                  <span className="font-medium">{cat.value}%</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Top Selling */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-card rounded-2xl border p-6"
        >
          <h3 className="font-bold mb-4">Top Selling Items</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left pb-3 text-muted-foreground font-medium">#</th>
                  <th className="text-left pb-3 text-muted-foreground font-medium">Item</th>
                  <th className="text-right pb-3 text-muted-foreground font-medium">Qty Sold</th>
                  <th className="text-right pb-3 text-muted-foreground font-medium">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {dashboardStats.topItems.map((item, i) => (
                  <tr key={item.name} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="py-3 font-medium text-muted-foreground">{i + 1}</td>
                    <td className="py-3 font-medium">{item.name}</td>
                    <td className="py-3 text-right text-muted-foreground">{item.quantity}</td>
                    <td className="py-3 text-right font-bold">₨{item.revenue.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </AdminSidebar>
  );
};

export default AdminDashboard;
