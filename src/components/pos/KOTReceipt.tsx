import { motion } from 'framer-motion';
import { X, Printer } from 'lucide-react';
import type { CartItem, TableData } from '@/lib/mock-data';
import { toast } from 'sonner';

interface KOTReceiptProps {
  table: TableData;
  items: CartItem[];
  onClose: () => void;
}

const KOTReceipt = ({ table, items, onClose }: KOTReceiptProps) => {
  const now = new Date();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-card rounded-2xl shadow-float w-full max-w-sm mx-4"
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-bold">Kitchen Order Ticket</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted"><X className="w-4 h-4" /></button>
        </div>

        {/* KOT Content - Thermal style */}
        <div className="p-6 font-mono text-sm space-y-3">
          <div className="text-center space-y-1">
            <p className="font-bold text-base">🍽️ RestoPOS</p>
            <p className="text-muted-foreground text-xs">Kitchen Order Ticket</p>
            <div className="border-t border-dashed my-2" />
          </div>

          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Table: {table.name}</span>
            <span>ORD-{2043 + table.id}</span>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{now.toLocaleDateString()}</span>
            <span>{now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Server: Staff</span>
          </div>

          <div className="border-t border-dashed" />

          <div className="space-y-2">
            {items.map(item => (
              <div key={item.product.id} className="flex justify-between">
                <span>{item.product.name}</span>
                <span className="font-bold">x{item.quantity}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-dashed" />
          <p className="text-center text-xs text-muted-foreground">--- END OF KOT ---</p>
        </div>

        <div className="p-4 border-t flex gap-2">
          <button
            onClick={() => { toast.success('KOT sent to kitchen'); onClose(); }}
            className="flex-1 h-11 rounded-xl gradient-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2"
          >
            <Printer className="w-4 h-4" /> Print & Send
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default KOTReceipt;
