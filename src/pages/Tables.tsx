import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogOut, UtensilsCrossed, LayoutGrid, Clock } from 'lucide-react';
import type { TableData } from '@/lib/mock-data';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/pos-context';
import TableCard from '@/components/pos/TableCard';

const Tables = () => {
  const [filter, setFilter] = useState<'all' | 'available' | 'occupied' | 'reserved'>('all');
  const navigate = useNavigate();
  const { userName, logout } = useAuth();

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000';

  const { data: tables = [], isLoading, isError } = useQuery<TableData[]>({
    queryKey: ['tables'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/api/tables`);
      if (!response.ok) {
        throw new Error('Failed to load tables');
      }
      return response.json();
    },
  });

  const filtered = filter === 'all' ? tables : tables.filter(t => t.status === filter);

  const counts = {
    all: tables.length,
    available: tables.filter(t => t.status === 'available').length,
    occupied: tables.filter(t => t.status === 'occupied').length,
    reserved: tables.filter(t => t.status === 'reserved').length,
  };

  const handleTableClick = (table: TableData) => {
    navigate(`/order/${table.id}`, { state: { table } });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-card/80 backdrop-blur-xl border-b">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center">
              <UtensilsCrossed className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg">RestoPOS</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted text-sm">
              <Clock className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div className="text-sm text-muted-foreground">
              Hi, <span className="font-medium text-foreground">{userName || 'Staff'}</span>
            </div>
            <button
              onClick={() => { logout(); navigate('/'); }}
              className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-destructive transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Title & Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <LayoutGrid className="w-6 h-6 text-primary" />
              Table Overview
            </h1>
            <p className="text-muted-foreground text-sm mt-1">Select a table to start or resume an order</p>
          </div>
          <div className="flex gap-2">
            {(['all', 'available', 'occupied', 'reserved'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  filter === f
                    ? 'gradient-primary text-primary-foreground shadow-soft'
                    : 'bg-card border text-muted-foreground hover:text-foreground hover:border-primary/30'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)} ({counts[f]})
              </button>
            ))}
          </div>
        </div>

        {/* Table Grid */}
        {isLoading && (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            Loading tables...
          </div>
        )}
        {isError && !isLoading && (
          <div className="flex items-center justify-center py-20 text-destructive">
            Failed to load tables
          </div>
        )}
        {!isLoading && !isError && (
          <motion.div layout className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
            {filtered.map((table, i) => (
              <TableCard key={table.id} table={table} index={i} onClick={() => handleTableClick(table)} />
            ))}
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default Tables;
