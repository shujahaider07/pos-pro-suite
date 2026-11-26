import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Printer } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import type { CartItem, TableData } from '@/lib/mock-data';
import { toast } from 'sonner';

interface KOTReceiptProps {
  table: TableData;
  items: CartItem[];
  allItems?: CartItem[];
  orderNumber?: string | null;
  serverName?: string | null;
  kotNumber?: number;
  isAddon?: boolean;
  onClose: () => void;
  onPrintSuccess?: () => void;
}

interface ChargeSettings {
  taxEnabled: boolean;
  taxPercent: number;
  serviceEnabled: boolean;
  servicePercent: number;
}

const KOTReceipt = ({
  table,
  items,
  allItems,
  orderNumber,
  serverName,
  kotNumber = 1,
  isAddon = false,
  onClose,
  onPrintSuccess
}: KOTReceiptProps) => {
  const [showFull, setShowFull] = useState(false);
  const now = new Date();
  const displayOrderNumber = orderNumber ?? table.orderId ?? `ORD-${2043 + table.id}`;

  const hasAddonToggle = isAddon && allItems && allItems.length > items.length;
  const displayItems = showFull && allItems ? allItems : items;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 backdrop-blur-sm print:p-0 print:m-0 print:bg-white"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-card rounded-2xl shadow-float w-full max-w-sm mx-4 print:shadow-none print:w-full print:max-w-none print:m-0 print:border-none print-receipt-card"
      >
        <div className="flex items-center justify-between p-4 border-b no-print">
          <div>
            <h3 className="font-bold">Kitchen Order Ticket</h3>
            <span className="text-xs text-primary font-semibold">
              {isAddon ? `KOT #${kotNumber} (Running Order / Add-on)` : `KOT #${kotNumber} (New Order)`}
            </span>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted"><X className="w-4 h-4" /></button>
        </div>

        {hasAddonToggle && (
          <div className="p-3 pb-0 no-print">
            <div className="flex bg-muted/70 p-1 rounded-xl text-xs gap-1 border">
              <button
                type="button"
                onClick={() => setShowFull(false)}
                className={`flex-1 py-1.5 px-2 rounded-lg transition-all ${
                  !showFull
                    ? 'bg-background shadow-sm text-foreground font-bold'
                    : 'text-muted-foreground hover:text-foreground font-medium'
                }`}
              >
                ⚡ New Items Only ({items.length})
              </button>
              <button
                type="button"
                onClick={() => setShowFull(true)}
                className={`flex-1 py-1.5 px-2 rounded-lg transition-all ${
                  showFull
                    ? 'bg-background shadow-sm text-foreground font-bold'
                    : 'text-muted-foreground hover:text-foreground font-medium'
                }`}
              >
                📋 Full Order ({allItems.length})
              </button>
            </div>
          </div>
        )}

        <div className="p-6 font-mono text-sm space-y-3 print:p-2 print-area">
          <div className="text-center space-y-1">
            <p className="font-bold text-base">🍽️ SYR POS</p>
            <p className="text-muted-foreground text-xs font-semibold">
              KITCHEN ORDER TICKET (KOT #{kotNumber})
            </p>
            {isAddon && !showFull && (
              <div className="text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-dashed border-amber-300 dark:border-amber-700 py-1 px-2 rounded">
                ⚡ RUNNING ORDER - NEW ITEMS ONLY
              </div>
            )}
            {isAddon && showFull && (
              <div className="text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border border-dashed border-blue-300 dark:border-blue-700 py-1 px-2 rounded">
                📋 FULL ORDER REPRINT
              </div>
            )}
            <div className="border-t border-dashed my-2" />
          </div>

          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Table: <strong className="text-foreground">{table.name}</strong></span>
            <span>{displayOrderNumber}</span>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{now.toLocaleDateString()}</span>
            <span>{now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Server: {serverName || 'Staff'}</span>
            <span className="font-semibold text-foreground">
              {isAddon ? `KOT #${kotNumber} (Add-on)` : `KOT #${kotNumber}`}
            </span>
          </div>

          <div className="border-t border-dashed" />

          <div className="space-y-2">
            {displayItems.map(item => (
              <div key={item.product.id} className="flex justify-between items-center">
                <span className="font-medium">{item.product.name}</span>
                <span className="font-black text-base">x{item.quantity}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-dashed" />
          <p className="text-center text-xs text-muted-foreground">
            --- END OF KOT #{kotNumber} ---
          </p>
        </div>

        <div className="p-4 border-t flex gap-2 no-print">
          <button
            onClick={() => {
              window.print();
              onPrintSuccess?.();
              toast.success(`KOT #${kotNumber} sent to printer`);
            }}
            className="flex-1 h-11 rounded-xl gradient-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2"
          >
            <Printer className="w-4 h-4" /> Print & Send KOT #{kotNumber}
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
  serverName?: string | null;
  isPaid?: boolean;
  onProceedPayment?: () => void;
  onClose: () => void;
}

export const BillReceipt = ({ table, items, orderNumber, serverName, isPaid, onProceedPayment, onClose }: BillReceiptProps) => {
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

  const displayOrderNumber = orderNumber ?? table.orderId ?? `ORD-${2043 + table.id}`;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 backdrop-blur-sm print:p-0 print:m-0 print:bg-white"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-card rounded-2xl shadow-float w-full max-w-sm mx-4 print:shadow-none print:w-full print:max-w-none print:m-0 print:border-none print-receipt-card"
      >
        <div className="flex items-center justify-between p-4 border-b no-print">
          <h3 className="font-bold">{isPaid ? 'Payment Receipt (PAID)' : 'Customer Bill'}</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-6 font-mono text-sm space-y-3 print:p-2 print-area">
          <div className="text-center space-y-1">
            <p className="font-bold text-base">🍽️ SYR POS</p>
            <p className="text-muted-foreground text-xs">{isPaid ? 'TAX INVOICE / RECEIPT' : 'Customer Bill'}</p>
            {isPaid && (
              <div className="inline-block px-3 py-1 my-1 border-2 border-dashed border-emerald-600 text-emerald-600 font-bold text-xs rounded">
                *** PAID ***
              </div>
            )}
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
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Server: {serverName || 'Staff'}</span>
            <span>Status: {isPaid ? 'Completed' : 'Pending Payment'}</span>
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
            <div className="border-t border-dashed pt-1 flex justify-between font-bold text-base">
              <span>Grand Total</span>
              <span>₨{grandTotal.toLocaleString()}</span>
            </div>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-2">Thank you for dining with us!</p>
        </div>

        <div className="p-4 border-t flex flex-col sm:flex-row gap-2 no-print">
          <button
            onClick={() => { window.print(); toast.success('Bill sent to printer'); }}
            className="flex-1 h-11 rounded-xl gradient-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2"
          >
            <Printer className="w-4 h-4" /> Print Bill
          </button>
          {!isPaid && onProceedPayment && (
            <button
              onClick={onProceedPayment}
              className="flex-1 h-11 rounded-xl gradient-success text-success-foreground font-semibold text-sm flex items-center justify-center gap-2"
            >
              💳 Collect Payment
            </button>
          )}
          {isPaid && (
            <button
              onClick={onClose}
              className="flex-1 h-11 rounded-xl border font-semibold text-sm hover:bg-muted transition-colors"
            >
              Done
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default KOTReceipt;
