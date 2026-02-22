import { motion, AnimatePresence } from 'framer-motion';
import { Minus, Plus, Trash2, Clock, ShoppingBag } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import type { CartItem, TableData } from '@/lib/mock-data';

interface ChargeSettings {
  taxEnabled: boolean;
  taxPercent: number;
  serviceEnabled: boolean;
  servicePercent: number;
}

interface CartPanelProps {
  table: TableData;
  items: CartItem[];
  onUpdateQuantity: (productId: number, delta: number) => void;
  onRemoveItem: (productId: number) => void;
  onPrintKOT: () => void;
  onHoldOrder: () => void;
  onProceedPayment: () => void;
  onCancelOrder: () => void;
  elapsedMinutes: number;
}

const CartPanel = ({
  table, items, onUpdateQuantity, onRemoveItem,
  onPrintKOT, onHoldOrder, onProceedPayment, onCancelOrder, elapsedMinutes,
}: CartPanelProps) => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000';

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

  return (
    <div className="flex flex-col h-full bg-card border-l">
      {/* Header */}
      <div className="p-5 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-bold text-lg">{table.name}</h2>
            <p className="text-xs text-muted-foreground">ORD-{2043 + table.id}</p>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            {elapsedMinutes}m
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto pos-scrollbar p-4 space-y-2">
        <AnimatePresence>
          {items.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <ShoppingBag className="w-12 h-12 mb-3 opacity-20" />
              <p className="text-sm">Cart is empty</p>
              <p className="text-xs">Add items from the menu</p>
            </motion.div>
          ) : (
            items.map(item => (
              <motion.div
                key={item.product.id}
                layout
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20, height: 0 }}
                className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 group"
              >
                <span className="text-2xl">{item.product.image}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.product.name}</p>
                  <p className="text-xs text-muted-foreground">₨{item.product.price} each</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onUpdateQuantity(item.product.id, -1)}
                    className="w-7 h-7 rounded-lg border flex items-center justify-center hover:bg-muted transition-colors"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-7 text-center text-sm font-bold">{item.quantity}</span>
                  <button
                    onClick={() => onUpdateQuantity(item.product.id, 1)}
                    className="w-7 h-7 rounded-lg border flex items-center justify-center hover:bg-muted transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
                <span className="text-sm font-bold w-16 text-right">₨{item.product.price * item.quantity}</span>
                <button
                  onClick={() => onRemoveItem(item.product.id)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Totals & Actions */}
      {items.length > 0 && (
        <div className="border-t p-5 space-y-4">
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between text-sm">
              <span>Subtotal</span><span>₨{subtotal.toLocaleString()}</span>
            </div>
            {chargeSettings?.taxEnabled && (
              <div className="flex justify-between text-muted-foreground">
                <span>Tax ({chargeSettings.taxPercent}%)</span><span>₨{tax.toLocaleString()}</span>
              </div>
            )}
            {chargeSettings?.serviceEnabled && (
              <div className="flex justify-between text-muted-foreground">
                <span>Service ({chargeSettings.servicePercent}%)</span><span>₨{serviceCharge.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg pt-2 border-t">
              <span>Total</span>
              <span className="text-gradient-primary">₨{grandTotal.toLocaleString()}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={onPrintKOT} className="h-11 rounded-xl gradient-success text-success-foreground font-semibold text-sm hover:opacity-90 transition-opacity">
              🖨️ Print KOT
            </button>
            <button onClick={onHoldOrder} className="h-11 rounded-xl gradient-warning text-warning-foreground font-semibold text-sm hover:opacity-90 transition-opacity">
              ⏸️ Hold
            </button>
            <button onClick={onProceedPayment} className="h-11 rounded-xl gradient-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity col-span-2">
              💳 Proceed to Payment
            </button>
            <button onClick={onCancelOrder} className="h-11 rounded-xl border border-destructive/30 text-destructive font-semibold text-sm hover:bg-destructive/5 transition-colors col-span-2">
              Cancel Order
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartPanel;
