import { motion } from 'framer-motion';
import { X, Clock, Users, ChevronRight } from 'lucide-react';
import { TableCard } from '@/components/pos/TableCard';

interface TableModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (tableId: number) => void;
  tables: TableData[];
}

interface TableData {
  id: number;
  name: string;
  capacity: number;
  status: 'available' | 'occupied' | 'reserved';
  orderId?: number;
  orderTotal?: number;
  elapsedMinutes?: number;
}

const TableModal = ({ open, onClose, onSelect, tables }: TableModalProps) => {
  if (!open) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-card rounded-2xl shadow-float w-full max-w-[90vh] mx-4"
      >
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="font-bold text-lg">Select a Table</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4">
          <div className="max-h-[70vh] overflow-y-auto pos-scrollbar space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {tables.map((table, index) => (
                <TableCard
                  key={table.id}
                  table={table}
                  index={index}
                  onClick={() => {
                    onSelect(table.id);
                    onClose();
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default TableModal;