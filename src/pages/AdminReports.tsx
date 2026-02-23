import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar, FileText } from 'lucide-react';
import AdminSidebar from '@/components/pos/AdminSidebar';

interface OrderReportItem {
  id: number;
  orderNumber: string;
  tableName: string;
  status: string;
  createdAt: string;
  totalAmount: number;
}

const AdminReports = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000';
  const [days, setDays] = useState(30);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [tableFilter, setTableFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [search, setSearch] = useState('');

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

  const tableOptions = Array.from(new Set(reports.map(o => o.tableName))).sort();

  const filteredReports = reports.filter(order => {
    if (tableFilter !== 'all' && order.tableName !== tableFilter) return false;
    if (statusFilter !== 'all' && order.status !== statusFilter) return false;

    if (startTime || endTime) {
      const orderDate = new Date(order.createdAt);
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
      if (
        !orderNumber.includes(term) &&
        !tableName.includes(term) &&
        !status.includes(term)
      ) {
        return false;
      }
    }

    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filteredReports.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const pagedReports = filteredReports.slice(startIndex, endIndex);

  const totalRevenue = filteredReports.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalOrders = filteredReports.length;
  const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

  const createCsvValue = (value: string | number) => {
    const str = String(value).replace(/"/g, '""');
    return `"${str}"`;
  };

  const handleExportExcel = () => {
    if (!filteredReports.length) return;

    const header = ['Date', 'Time', 'Order #', 'Table', 'Status', 'Total'];
    const rows = filteredReports.map(order => {
      const date = new Date(order.createdAt);
      const dateLabel = date.toLocaleDateString();
      const timeLabel = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return [
        dateLabel,
        timeLabel,
        order.orderNumber,
        order.tableName,
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
body { font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; padding: 16px; }
h1 { font-size: 18px; margin-bottom: 8px; }
table { width: 100%; border-collapse: collapse; font-size: 12px; }
th, td { border: 1px solid #ccc; padding: 4px 6px; }
th { background-color: #f3f4f6; text-align: left; }
</style>
</head>
<body>
<h1>Sales Report</h1>
<p>Filtered orders: ${filteredReports.length}</p>
<table>
<thead>
<tr>
<th>Date</th>
<th>Time</th>
<th>Order #</th>
<th>Table</th>
<th>Status</th>
<th>Total</th>
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
      <div className="p-8">
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold mb-1">Reports</h1>
              <p className="text-muted-foreground text-sm">
                Completed orders ka summary, table-wise aur time-wise filters ke sath
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
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
                  <option value={7}>Last 7 days</option>
                  <option value={30}>Last 30 days</option>
                  <option value={90}>Last 90 days</option>
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
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span>Time filter:</span>
            <div className="flex items-center gap-2">
              <span>From</span>
              <input
                type="time"
                value={startTime}
                onChange={e => {
                  setStartTime(e.target.value);
                  setPage(1);
                }}
                className="h-8 rounded-md border bg-background px-2 text-xs"
              />
            </div>
            <div className="flex items-center gap-2">
              <span>To</span>
              <input
                type="time"
                value={endTime}
                onChange={e => {
                  setEndTime(e.target.value);
                  setPage(1);
                }}
                className="h-8 rounded-md border bg-background px-2 text-xs"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
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
            </div>
          </div>
          <div className="bg-card rounded-2xl border p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Avg Order Value</p>
              <p className="text-xl font-bold">₨{avgOrderValue.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-2xl border p-6">
          <div className="flex items-center justify-between mb-4 gap-4">
            <div className="flex items-center gap-3">
              <h2 className="font-semibold text-lg">Sales Report</h2>
              {isLoading && <span className="text-xs text-muted-foreground">Loading...</span>}
              {isError && <span className="text-xs text-destructive">Failed to load</span>}
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <input
                type="text"
                value={search}
                onChange={e => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search order #, table, status"
                className="h-8 rounded-md border bg-background px-2 text-xs text-foreground"
              />
              <button
                type="button"
                onClick={handleExportExcel}
                className="h-8 px-3 rounded-md border text-xs"
              >
                Export Excel
              </button>
              <button
                type="button"
                onClick={handleExportPdf}
                className="h-8 px-3 rounded-md border text-xs"
              >
                Export PDF
              </button>
              <span>Rows per page</span>
              <select
                value={pageSize}
                onChange={e => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="h-8 rounded-md border bg-background px-2 text-xs"
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
                  <th className="py-2 text-left">Date</th>
                  <th className="py-2 text-left">Order #</th>
                  <th className="py-2 text-left">Table</th>
                  <th className="py-2 text-left">Status</th>
                  <th className="py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {pagedReports.map(order => {
                  const date = new Date(order.createdAt);
                  const dateLabel = date.toLocaleDateString();
                  const timeLabel = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                  const statusColor =
                    order.status === 'Completed'
                      ? 'bg-emerald-100 text-emerald-700'
                      : order.status === 'Cancelled'
                      ? 'bg-rose-100 text-rose-700'
                      : order.status === 'Held'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-slate-100 text-slate-700';

                  return (
                    <tr key={order.id} className="border-b last:border-0">
                      <td className="py-2">
                        <div className="flex flex-col">
                          <span className="font-medium">{dateLabel}</span>
                          <span className="text-xs text-muted-foreground">{timeLabel}</span>
                        </div>
                      </td>
                      <td className="py-2 font-mono text-xs">{order.orderNumber}</td>
                      <td className="py-2">{order.tableName}</td>
                      <td className="py-2">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusColor}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="py-2 text-right font-semibold">
                        ₨{order.totalAmount.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
                {!filteredReports.length && !isLoading && (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-sm text-muted-foreground">
                      Is period mein koi orders nahi mile.
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
              {!filteredReports.length && !isLoading && <span>No data</span>}
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
    </AdminSidebar>
  );
};

export default AdminReports;
