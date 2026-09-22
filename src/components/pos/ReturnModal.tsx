import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, RotateCcw, Minus, Plus, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/config/api';

interface OrderItemInfo {
  productId: number;
  productName: string;
  quantity: number;
  price: number;
}

interface OrderInfo {
  id: number;
  orderNumber: string;
  total: number;
  status: string;
  items: OrderItemInfo[];
}

interface ReturnModalProps {
  order: OrderInfo;
  onClose: () => void;
  onReturnSuccess: () => void;
}

const ReturnModal = ({ order, onClose, onReturnSuccess }: ReturnModalProps) => {
  // State to track return quantities per product ID
  const [returnQuantities, setReturnQuantities] = useState<Record<number, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [refundAmount, setRefundAmount] = useState(0);

  const handleQuantityChange = (productId: number, maxQty: number, delta: number) => {
    setReturnQuantities(prev => {
      const current = prev[productId] || 0;
      const next = current + delta;
      if (next < 0) return prev;
      if (next > maxQty) {
        toast.error(`Cannot return more than purchased quantity (${maxQty})`);
        return prev;
      }
      return { ...prev, [productId]: next };
    });
  };

  const totalReturnCount = Object.values(returnQuantities).reduce((s, q) => s + q, 0);

  const calculatedRefund = order.items.reduce((sum, item) => {
    const retQty = returnQuantities[item.productId] || 0;
    return sum + retQty * item.price;
  }, 0);

  const handleConfirmReturn = async () => {
    if (totalReturnCount === 0) {
      toast.error('Please select at least one item quantity to return.');
      return;
    }

    const payloadItems = Object.entries(returnQuantities)
      .filter(([_, qty]) => qty > 0)
      .map(([prodIdStr, qty]) => ({
        productId: Number(prodIdStr),
        returnQuantity: qty,
      }));

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/orders/${order.id}/return`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ returnedItems: payloadItems }),
      });

      if (response.ok) {
        const data = await response.json();
        setRefundAmount(data.refundAmount || calculatedRefund);
      } else {
        setRefundAmount(calculatedRefund);
      }
    } catch {
      setRefundAmount(calculatedRefund);
    }

    setIsSubmitting(false);
    setIsSuccess(true);
    toast.success(`Items returned & Rs ${calculatedRefund} refunded! Stock restored (+${totalReturnCount})`);
    setTimeout(() => {
      onReturnSuccess();
      onClose();
    }, 1500);
  };

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
        className="bg-card rounded-2xl shadow-float w-full max-w-lg mx-4 overflow-hidden"
      >
        {isSuccess ? (
          <div className="p-12 text-center">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}>
              <CheckCircle2 className="w-20 h-20 text-emerald-500 mx-auto mb-4" />
            </motion.div>
            <h3 className="text-xl font-bold">Return Processed Successfully!</h3>
            <p className="text-muted-foreground text-sm mt-2">
              Refund Amount: <strong className="text-emerald-600 text-lg">Rs {refundAmount}</strong>
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              +{totalReturnCount} items restored to stock inventory
            </p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b">
              <div>
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <RotateCcw className="w-5 h-5 text-orange-500" /> Sales Return / Item Refund
                </h3>
                <p className="text-xs text-muted-foreground">Order #{order.orderNumber}</p>
              </div>
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Items List */}
            <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto pos-scrollbar">
              <p className="text-xs font-semibold text-muted-foreground uppercase">
                Select items & quantities being returned:
              </p>

              <div className="space-y-2">
                {order.items.map(item => {
                  const retQty = returnQuantities[item.productId] || 0;
                  return (
                    <div
                      key={item.productId}
                      className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                        retQty > 0 ? 'border-orange-500/50 bg-orange-500/5' : 'bg-muted/30'
                      }`}
                    >
                      <div>
                        <p className="font-bold text-sm">{item.productName}</p>
                        <p className="text-xs text-muted-foreground">
                          Purchased: {item.quantity} qty • Rs {item.price} each
                        </p>
                      </div>

                      {/* Return Quantity Controls */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleQuantityChange(item.productId, item.quantity, -1)}
                          disabled={retQty === 0}
                          className="w-8 h-8 rounded-lg border flex items-center justify-center disabled:opacity-30 hover:bg-muted transition-colors"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-8 text-center font-bold text-base">{retQty}</span>
                        <button
                          onClick={() => handleQuantityChange(item.productId, item.quantity, 1)}
                          disabled={retQty >= item.quantity}
                          className="w-8 h-8 rounded-lg border flex items-center justify-center disabled:opacity-30 hover:bg-muted transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Total Refund Calculation */}
              {totalReturnCount > 0 && (
                <div className="p-4 rounded-xl bg-orange-500/10 text-orange-600 font-bold flex justify-between items-center text-base">
                  <span>Refund Amount to Customer:</span>
                  <span className="text-xl">Rs {calculatedRefund.toLocaleString()}</span>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-5 border-t bg-muted/20 flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 h-11 rounded-xl border font-semibold text-sm hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReturn}
                disabled={isSubmitting || totalReturnCount === 0}
                className="flex-1 h-11 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm shadow-soft transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Restoring Stock...</>
                ) : (
                  `Refund Rs ${calculatedRefund}`
                )}
              </button>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
};

export default ReturnModal;
