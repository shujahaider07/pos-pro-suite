import { motion } from 'framer-motion';
import { Clock, Users, ChevronRight } from 'lucide-react';
import type { TableData } from '@/lib/mock-data';

interface TableCardProps {
  table: TableData;
  index: number;
  onClick: () => void;
}

const statusConfig = {
  available: {
    label: 'Available',
    dotClass: 'bg-success',
    borderClass: 'border-success/30 glow-success',
    badgeClass: 'bg-success/10 text-success',
  },
  occupied: {
    label: 'Occupied',
    dotClass: 'bg-warning',
    borderClass: 'border-warning/30 glow-warning',
    badgeClass: 'bg-warning/10 text-warning',
  },
  reserved: {
    label: 'Reserved',
    dotClass: 'bg-destructive',
    borderClass: 'border-destructive/30 glow-danger',
    badgeClass: 'bg-destructive/10 text-destructive',
  },
};

const TableCard = ({ table, index, onClick }: TableCardProps) => {
  const config = statusConfig[table.status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      onClick={onClick}
      className={`relative bg-card rounded-2xl border-2 p-6 cursor-pointer transition-all duration-300 hover:shadow-elevated hover:scale-[1.02] active:scale-[0.98] ${config.borderClass}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-2xl font-bold">{table.name}</h3>
          <div className="flex items-center gap-1.5 mt-1 text-muted-foreground text-sm">
            <Users className="w-3.5 h-3.5" />
            <span>{table.capacity} seats</span>
          </div>
        </div>
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${config.badgeClass}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${config.dotClass} animate-pulse-soft`} />
          {config.label}
        </span>
      </div>

      {table.status === 'occupied' && (
        <div className="space-y-2 pt-3 border-t border-border">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Order</span>
            <span className="font-medium">{table.orderId}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total</span>
            <span className="font-bold text-foreground">₨{table.orderTotal?.toLocaleString()}</span>
          </div>
          {typeof table.holdItems === 'number' && table.holdItems > 0 && (
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Held items</span>
              <span className="font-medium text-foreground">{table.holdItems}</span>
            </div>
          )}
          <div className="flex items-center gap-1 text-muted-foreground text-xs">
            <Clock className="w-3 h-3" />
            <span>{table.elapsedMinutes} min ago</span>
          </div>
        </div>
      )}

      <div className="absolute bottom-4 right-4 text-muted-foreground/30">
        <ChevronRight className="w-5 h-5" />
      </div>
    </motion.div>
  );
};

export default TableCard;
