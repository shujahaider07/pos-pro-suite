import { motion } from 'framer-motion';
import { X, Printer } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import type { CartItem, TableData } from '@/lib/mock-data';
import { toast } from 'sonner';

interface KOTReceiptProps {
  table: TableData;
  items: CartItem[];
  onClose: () => void;
}

interface ChargeSettings {
  taxEnabled: boolean;
  taxPercent: number;
  serviceEnabled: boolean;
  servicePercent: number;
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

        <div className="p-6 font-mono text-sm space-y-3">
          <div className="text-center space-y-1">
            <p className="font-bold text-base">🍽️ SYR POS</p>
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
            onClick={() => { window.print(); toast.success('KOT sent to kitchen'); onClose(); }}
            className="flex-1 h-11 rounded-xl gradient-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2"
          >
            <Printer className="w-4 h-4" /> Print & Send
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

interface BillReceiptProps {
  table: TableData;
  items: CartItem[];
  orderNumber?: string | null;
  onClose: () => void;
}

export const BillReceipt = ({ table, items, orderNumber, onClose }: BillReceiptProps) => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000';
  const now = new Date();

  const { data: chargeSettings } = useQuery<ChargeSettings>({
    queryKey: ['charges'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/api/charges`);
      if (!res.ok) throw new Error('Failed to load charges');
      return res.json();
    },
  });

  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const taxRate = chargeSettings?.taxEnabled ? chargeSettings.taxPercent / 100 : 0;
  const serviceRate = chargeSettings?.serviceEnabled ? chargeSettings.servicePercent / 100 : 0;
  const tax = Math.round(subtotal * taxRate);
  const serviceCharge = Math.round(subtotal * serviceRate);
  const grandTotal = subtotal + tax + serviceCharge;

  const displayOrderNumber = orderNumber ?? `ORD-${2043 + table.id}`;

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
          <h3 className="font-bold">Customer Bill</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-6 font-mono text-sm space-y-3">
          <div className="text-center space-y-1">
            <p className="font-bold text-base">🍽️ SYR POS</p>
            <p className="text-muted-foreground text-xs">Customer Bill</p>
            <div className="border-t border-dashed my-2" />
          </div>

          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Table: {table.name}</span>
            <span>{displayOrderNumber}</span>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{now.toLocaleDateString()}</span>
            <span>{now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>

          <div className="border-t border-dashed" />

          <div className="space-y-2">
            {items.map(item => (
              <div key={item.product.id} className="flex justify-between">
                <span>{item.product.name} x{item.quantity}</span>
                <span>₨{(item.product.price * item.quantity).toLocaleString()}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-dashed pt-2 space-y-1">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>₨{subtotal.toLocaleString()}</span>
            </div>
            {chargeSettings?.taxEnabled && (
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Tax ({chargeSettings.taxPercent}%)</span>
                <span>₨{tax.toLocaleString()}</span>
              </div>
            )}
            {chargeSettings?.serviceEnabled && (
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Service ({chargeSettings.servicePercent}%)</span>
                <span>₨{serviceCharge.toLocaleString()}</span>
              </div>
            )}
            <div className="border-t border-dashed pt-1 flex justify-between font-bold">
              <span>Total</span>
              <span>₨{grandTotal.toLocaleString()}</span>
            </div>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-2">Thank you for dining with us!</p>
        </div>

        <div className="p-4 border-t flex gap-2">
          <button
            onClick={() => { window.print(); toast.success('Bill sent to printer'); }}
            className="flex-1 h-11 rounded-xl gradient-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2"
          >
            <Printer className="w-4 h-4" /> Print Bill
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default KOTReceipt;
