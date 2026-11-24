import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Calendar,
  FileText,
  ShoppingBag,
  TrendingUp,
  Package,
  Eye,
  RotateCcw,
  Download,
  Printer,
  Users,
  Grid3X3,
} from 'lucide-react';
import AdminSidebar from '@/components/pos/AdminSidebar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

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

const AdminReports = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000';
  const [days, setDays] = useState(30);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [tableFilter, setTableFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [staffFilter, setStaffFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<OrderReportItem | null>(null);
  const [breakdownTab, setBreakdownTab] = useState<'tables' | 'staff'>('tables');

  const { data, isLoading, isError } = useQuery<OrderReportItem[]>({
    queryKey: ['order-history', days],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/api/orders/history?days=${days}`);
      if (!response.ok) {
        throw new Error('Failed to load reports');
      }
      return response.json();
    },
  });

  const reports = data ?? [];

  const tableOptions = useMemo(
    () => Array.from(new Set(reports.map(o => o.tableName))).sort(),
    [reports]
  );

  const staffOptions = useMemo(
    () =>
      Array.from(
        new Set(reports.map(o => o.createdBy).filter((s): s is string => Boolean(s && s.trim())))
      ).sort(),
    [reports]
  );

  const filteredReports = useMemo(() => {
    return reports.filter(order => {
      if (tableFilter !== 'all' && order.tableName !== tableFilter) return false;
      if (statusFilter !== 'all' && order.status !== statusFilter) return false;
      if (staffFilter !== 'all' && (order.createdBy || 'Unknown') !== staffFilter) return false;

      const orderDate = new Date(order.createdAt);

      if (startDate) {
        const from = new Date(`${startDate}T00:00:00`);
        if (orderDate < from) return false;
      }

      if (endDate) {
        const to = new Date(`${endDate}T23:59:59`);
        if (orderDate > to) return false;
      }

      if (startTime || endTime) {
        const orderMinutes = orderDate.getHours() * 60 + orderDate.getMinutes();

        if (startTime) {
          const [sh, sm] = startTime.split(':').map(Number);
          const startMinutes = sh * 60 + (sm || 0);
          if (orderMinutes < startMinutes) return false;
        }

        if (endTime) {
          const [eh, em] = endTime.split(':').map(Number);
          const endMinutes = eh * 60 + (em || 0);
          if (orderMinutes > endMinutes) return false;
        }
      }

      if (search) {
        const term = search.toLowerCase();
        const orderNumber = order.orderNumber.toLowerCase();
        const tableName = order.tableName.toLowerCase();
        const status = order.status.toLowerCase();
        const staff = (order.createdBy || '').toLowerCase();
        if (
          !orderNumber.includes(term) &&
          !tableName.includes(term) &&
          !status.includes(term) &&
          !staff.includes(term)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [reports, tableFilter, statusFilter, staffFilter, startDate, endDate, startTime, endTime, search]);

  const totalPages = Math.max(1, Math.ceil(filteredReports.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const pagedReports = filteredReports.slice(startIndex, endIndex);

  const completedOrders = filteredReports.filter(o => o.status === 'Completed');
  const heldOrdersCount = filteredReports.filter(o => o.status === 'Held').length;
  const cancelledOrdersCount = filteredReports.filter(o => o.status === 'Cancelled').length;

  const totalRevenue = filteredReports.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalOrders = filteredReports.length;
  const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
  const totalItemsSold = filteredReports.reduce(
    (sum, o) => sum + (o.itemsCount ?? o.items?.reduce((s, i) => s + i.quantity, 0) ?? 0),
    0
  );

  // Top Selling Items from filtered orders
  const topItems = useMemo(() => {
    const map = new Map<string, { name: string; quantity: number; revenue: number }>();
    for (const order of filteredReports) {
      if (order.status === 'Cancelled') continue;
      for (const item of order.items ?? []) {
        const existing = map.get(item.productName) ?? { name: item.productName, quantity: 0, revenue: 0 };
        existing.quantity += item.quantity;
        existing.revenue += item.quantity * item.unitPrice;
        map.set(item.productName, existing);
      }
    }
    return Array.from(map.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [filteredReports]);

  // Table-wise summary
  const tableSummary = useMemo(() => {
    const map = new Map<string, { name: string; orders: number; revenue: number }>();
    for (const order of filteredReports) {
      if (order.status === 'Cancelled') continue;
      const existing = map.get(order.tableName) ?? { name: order.tableName, orders: 0, revenue: 0 };
      existing.orders += 1;
      existing.revenue += order.totalAmount;
      map.set(order.tableName, existing);
    }
    return Array.from(map.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [filteredReports]);

  // Staff-wise summary
  const staffSummary = useMemo(() => {
    const map = new Map<string, { name: string; orders: number; revenue: number }>();
    for (const order of filteredReports) {
      if (order.status === 'Cancelled') continue;
      const staffName = order.createdBy || 'Unknown';
      const existing = map.get(staffName) ?? { name: staffName, orders: 0, revenue: 0 };
      existing.orders += 1;
      existing.revenue += order.totalAmount;
      map.set(staffName, existing);
    }
    return Array.from(map.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [filteredReports]);

  const hasActiveFilters =
    tableFilter !== 'all' ||
    statusFilter !== 'all' ||
    staffFilter !== 'all' ||
    startDate !== '' ||
    endDate !== '' ||
    startTime !== '' ||
    endTime !== '' ||
    search !== '';

  const resetFilters = () => {
    setTableFilter('all');
    setStatusFilter('all');
    setStaffFilter('all');
    setStartDate('');
    setEndDate('');
    setStartTime('');
    setEndTime('');
    setSearch('');
    setPage(1);
  };

  const createCsvValue = (value: string | number) => {
    const str = String(value).replace(/"/g, '""');
    return `"${str}"`;
  };

  const handleExportExcel = () => {
    if (!filteredReports.length) return;

    const header = ['Date', 'Time', 'Order #', 'Table', 'Staff', 'Items', 'Status', 'Total'];
    const rows = filteredReports.map(order => {
      const date = new Date(order.createdAt);
      const dateLabel = date.toLocaleDateString();
      const timeLabel = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return [
        dateLabel,
        timeLabel,
        order.orderNumber,
        order.tableName,
        order.createdBy || '-',
        order.itemsCount ?? 0,
        order.status,
        order.totalAmount.toFixed(2),
      ];
    });

    const csvLines = [
      header.map(createCsvValue).join(','),
      ...rows.map(row => row.map(createCsvValue).join(',')),
    ];

    const blob = new Blob([csvLines.join('\n')], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sales-report-${days}d.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPdf = () => {
    if (!filteredReports.length) return;

    const rows = filteredReports
      .map(order => {
        const date = new Date(order.createdAt);
        const dateLabel = date.toLocaleDateString();
        const timeLabel = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const totalLabel = `₨${order.totalAmount.toLocaleString()}`;
        return `<tr>
<td>${dateLabel}</td>
<td>${timeLabel}</td>
<td>${order.orderNumber}</td>
<td>${order.tableName}</td>
<td>${order.createdBy || '-'}</td>
<td style="text-align:center;">${order.itemsCount ?? 0}</td>
<td>${order.status}</td>
<td style="text-align:right;">${totalLabel}</td>
</tr>`;
      })
      .join('');

    const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Sales Report</title>
<style>
body { font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; padding: 20px; color: #111; }
h1 { font-size: 20px; margin-bottom: 4px; }
.summary { display: flex; gap: 24px; margin: 12px 0 18px; font-size: 13px; color: #444; }
table { width: 100%; border-collapse: collapse; font-size: 12px; }
th, td { border: 1px solid #d1d5db; padding: 6px 8px; }
th { background-color: #f3f4f6; text-align: left; }
</style>
</head>
<body>
<h1>SYR POS - Sales Report</h1>
<div class="summary">
  <div><strong>Orders:</strong> ${totalOrders}</div>
  <div><strong>Items Sold:</strong> ${totalItemsSold}</div>
  <div><strong>Total Revenue:</strong> ₨${totalRevenue.toLocaleString()}</div>
  <div><strong>Avg Order:</strong> ₨${avgOrderValue.toLocaleString()}</div>
</div>
<table>
<thead>
<tr>
<th>Date</th>
<th>Time</th>
<th>Order #</th>
<th>Table</th>
<th>Staff</th>
<th style="text-align:center;">Items</th>
<th>Status</th>
<th style="text-align:right;">Total</th>
</tr>
</thead>
<tbody>
${rows}
</tbody>
</table>
</body>
</html>`;

    const win = window.open('', '_blank', 'width=900,height=650');
    if (!win) return;
    win.document.open();
    win.document.write(html);
    win.document.close();
    win.focus();
    win.print();
  };

  return (
    <AdminSidebar>
      <div className="p-8 space-y-6">
        {/* Header & Filters */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold mb-1">Reports</h1>
              <p className="text-muted-foreground text-sm">
                Detailed sales report, top items, staff & table analytics with export
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border bg-card">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <select
                  value={days}
                  onChange={e => {
                    setDays(Number(e.target.value));
                    setPage(1);
                  }}
                  className="bg-transparent text-xs md:text-sm outline-none"
                >
                  <option value={0}>Today</option>
                  <option value={7}>Last 7 days</option>
                  <option value={30}>Last 30 days</option>
                  <option value={90}>Last 90 days</option>
                  <option value={365}>Last 1 year</option>
                </select>
              </div>
              <select
                value={tableFilter}
                onChange={e => {
                  setTableFilter(e.target.value);
                  setPage(1);
                }}
                className="h-9 rounded-xl border bg-card px-3 text-xs md:text-sm"
              >
                <option value="all">All tables</option>
                {tableOptions.map(name => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
              <select
                value={staffFilter}
                onChange={e => {
                  setStaffFilter(e.target.value);
                  setPage(1);
                }}
                className="h-9 rounded-xl border bg-card px-3 text-xs md:text-sm"
              >
                <option value="all">All staff</option>
                {staffOptions.map(name => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={e => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="h-9 rounded-xl border bg-card px-3 text-xs md:text-sm"
              >
                <option value="all">All status</option>
                <option value="Completed">Completed</option>
                <option value="Held">Held</option>
                <option value="Active">Active</option>
                <option value="Cancelled">Cancelled</option>
              </select>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="h-9 px-3 rounded-xl border bg-card text-xs font-medium flex items-center gap-1.5 hover:bg-muted"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Date & Time Range Filters */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground bg-card border rounded-xl px-4 py-2.5">
            <div className="flex items-center gap-2">
              <span className="font-medium text-foreground">Date:</span>
              <input
                type="date"
                value={startDate}
                onChange={e => {
                  setStartDate(e.target.value);
                  setPage(1);
                }}
                className="h-8 rounded-md border bg-background px-2 text-xs text-foreground"
              />
              <span>to</span>
              <input
                type="date"
                value={endDate}
                onChange={e => {
                  setEndDate(e.target.value);
                  setPage(1);
                }}
                className="h-8 rounded-md border bg-background px-2 text-xs text-foreground"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-foreground">Time:</span>
              <input
                type="time"
                value={startTime}
                onChange={e => {
                  setStartTime(e.target.value);
                  setPage(1);
                }}
                className="h-8 rounded-md border bg-background px-2 text-xs text-foreground"
              />
              <span>to</span>
              <input
                type="time"
                value={endTime}
                onChange={e => {
                  setEndTime(e.target.value);
                  setPage(1);
                }}
                className="h-8 rounded-md border bg-background px-2 text-xs text-foreground"
              />
            </div>
          </div>
        </div>

        {/* 4 KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-card rounded-2xl border p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Total Revenue</p>
              <p className="text-xl font-bold">₨{totalRevenue.toLocaleString()}</p>
            </div>
            <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center">
              <FileText className="w-4 h-4 text-primary-foreground" />
            </div>
          </div>

          <div className="bg-card rounded-2xl border p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Total Orders</p>
              <p className="text-xl font-bold">{totalOrders}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {completedOrders.length} completed · {heldOrdersCount} held · {cancelledOrdersCount} cancelled
              </p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-card rounded-2xl border p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Avg Order Value</p>
              <p className="text-xl font-bold">₨{avgOrderValue.toLocaleString()}</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-card rounded-2xl border p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Total Items Sold</p>
              <p className="text-xl font-bold">{totalItemsSold}</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Analytics Breakdown Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Selling Items */}
          <div className="bg-card rounded-2xl border p-5">
            <h2 className="font-semibold text-base mb-3">Top Selling Items (Filtered)</h2>
            {topItems.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4">No item data in selected range.</p>
            ) : (
              <div className="space-y-2.5">
                {topItems.map((item, idx) => (
                  <div key={item.name} className="flex items-center justify-between text-sm border-b last:border-0 pb-2 last:pb-0">
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-muted text-[11px] font-semibold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span className="font-medium">{item.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold">₨{item.revenue.toLocaleString()}</span>
                      <span className="text-xs text-muted-foreground ml-2">({item.quantity} sold)</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Table & Staff Summary */}
          <div className="bg-card rounded-2xl border p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-base">Performance Breakdown</h2>
              <div className="flex gap-1 bg-muted p-0.5 rounded-lg text-xs">
                <button
                  type="button"
                  onClick={() => setBreakdownTab('tables')}
                  className={`px-2.5 py-1 rounded-md flex items-center gap-1 font-medium transition ${
                    breakdownTab === 'tables' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  <Grid3X3 className="w-3.5 h-3.5" />
                  Tables
                </button>
                <button
                  type="button"
                  onClick={() => setBreakdownTab('staff')}
                  className={`px-2.5 py-1 rounded-md flex items-center gap-1 font-medium transition ${
                    breakdownTab === 'staff' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  Staff
                </button>
              </div>
            </div>
            {(breakdownTab === 'tables' ? tableSummary : staffSummary).length === 0 ? (
              <p className="text-xs text-muted-foreground py-4">No data in selected range.</p>
            ) : (
              <div className="space-y-2.5">
                {(breakdownTab === 'tables' ? tableSummary : staffSummary).map((entry, idx) => (
                  <div key={entry.name} className="flex items-center justify-between text-sm border-b last:border-0 pb-2 last:pb-0">
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-muted text-[11px] font-semibold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span className="font-medium">{entry.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold">₨{entry.revenue.toLocaleString()}</span>
                      <span className="text-xs text-muted-foreground ml-2">({entry.orders} orders)</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-card rounded-2xl border p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
            <div className="flex items-center gap-3">
              <h2 className="font-semibold text-lg">Sales Report</h2>
              {isLoading && <span className="text-xs text-muted-foreground">Loading...</span>}
              {isError && <span className="text-xs text-destructive">Failed to load</span>}
            </div>
            <div className="flex flex-wrap items-center gap-2.5 text-xs text-muted-foreground">
              <input
                type="text"
                value={search}
                onChange={e => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search order #, table, staff..."
                className="h-8 rounded-md border bg-background px-2.5 text-xs text-foreground"
              />
              <button
                type="button"
                onClick={handleExportExcel}
                disabled={!filteredReports.length}
                className="h-8 px-3 rounded-md border text-xs flex items-center gap-1.5 hover:bg-muted disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                Export CSV
              </button>
              <button
                type="button"
                onClick={handleExportPdf}
                disabled={!filteredReports.length}
                className="h-8 px-3 rounded-md border text-xs flex items-center gap-1.5 hover:bg-muted disabled:opacity-50"
              >
                <Printer className="w-3.5 h-3.5" />
                Print / PDF
              </button>
              <span>Rows</span>
              <select
                value={pageSize}
                onChange={e => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="h-8 rounded-md border bg-background px-2 text-xs text-foreground"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-xs text-muted-foreground">
                  <th className="py-2 text-left">Date & Time</th>
                  <th className="py-2 text-left">Order #</th>
                  <th className="py-2 text-left">Table</th>
                  <th className="py-2 text-left">Staff</th>
                  <th className="py-2 text-center">Items</th>
                  <th className="py-2 text-left">Status</th>
                  <th className="py-2 text-right">Total</th>
                  <th className="py-2 text-right">Details</th>
                </tr>
              </thead>
              <tbody>
                {pagedReports.map(order => {
                  const date = new Date(order.createdAt);
                  const dateLabel = date.toLocaleDateString();
                  const timeLabel = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                  const statusClass =
                    order.status === 'Completed'
                      ? 'bg-emerald-100 text-emerald-700'
                      : order.status === 'Held'
                      ? 'bg-amber-100 text-amber-700'
                      : order.status === 'Cancelled'
                      ? 'bg-rose-100 text-rose-700'
                      : 'bg-blue-100 text-blue-700';

                  return (
                    <tr key={order.id} className="border-b last:border-0 hover:bg-muted/40">
                      <td className="py-2.5 text-muted-foreground whitespace-nowrap">
                        {dateLabel} {timeLabel}
                      </td>
                      <td className="py-2.5 font-medium">{order.orderNumber}</td>
                      <td className="py-2.5">{order.tableName}</td>
                      <td className="py-2.5 text-muted-foreground">{order.createdBy || '-'}</td>
                      <td className="py-2.5 text-center">{order.itemsCount ?? order.items?.length ?? 0}</td>
                      <td className="py-2.5">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusClass}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="py-2.5 text-right font-semibold">
                        ₨{order.totalAmount.toLocaleString()}
                      </td>
                      <td className="py-2.5 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedOrder(order)}
                          className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md border hover:bg-muted"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {!filteredReports.length && (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-sm text-muted-foreground">
                      No orders found for the selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between mt-4 text-xs text-muted-foreground">
            <div>
              {filteredReports.length > 0 && (
                <span>
                  Showing {startIndex + 1}-{Math.min(endIndex, filteredReports.length)} of {filteredReports.length}
                </span>
              )}
              {!filteredReports.length && <span>No data</span>}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="h-8 px-3 rounded-md border text-xs disabled:opacity-50"
              >
                Previous
              </button>
              <span>
                Page {currentPage} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || filteredReports.length === 0}
                className="h-8 px-3 rounded-md border text-xs disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Order Details Modal */}
      <Dialog open={Boolean(selectedOrder)} onOpenChange={open => !open && setSelectedOrder(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Order {selectedOrder?.orderNumber}</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-2 text-xs bg-muted/50 p-3 rounded-xl">
                <div>
                  <span className="text-muted-foreground">Table:</span>{' '}
                  <span className="font-medium">{selectedOrder.tableName}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Staff:</span>{' '}
                  <span className="font-medium">{selectedOrder.createdBy || '-'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Status:</span>{' '}
                  <span className="font-medium">{selectedOrder.status}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Date:</span>{' '}
                  <span className="font-medium">
                    {new Date(selectedOrder.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="border rounded-xl overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-muted/60">
                    <tr className="border-b">
                      <th className="py-2 px-3 text-left">Item</th>
                      <th className="py-2 px-2 text-center">Qty</th>
                      <th className="py-2 px-2 text-right">Price</th>
                      <th className="py-2 px-3 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedOrder.items ?? []).map((item, idx) => (
                      <tr key={idx} className="border-b last:border-0">
                        <td className="py-2 px-3 font-medium">{item.productName}</td>
                        <td className="py-2 px-2 text-center">{item.quantity}</td>
                        <td className="py-2 px-2 text-right">₨{item.unitPrice.toLocaleString()}</td>
                        <td className="py-2 px-3 text-right font-semibold">
                          ₨{(item.quantity * item.unitPrice).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                    {(!selectedOrder.items || selectedOrder.items.length === 0) && (
                      <tr>
                        <td colSpan={4} className="py-4 text-center text-muted-foreground">
                          No item details available.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between pt-2 border-t font-bold text-base">
                <span>Total Amount</span>
                <span>₨{selectedOrder.totalAmount.toLocaleString()}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminSidebar>
  );
};

export default AdminReports;
