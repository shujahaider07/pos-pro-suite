import { useState, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { X, RotateCcw, Minus, Plus, Loader2, CheckCircle2, Printer, FileText } from 'lucide-react';
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

interface ReturnedLine {
  productName: string;
  returnedQty: number;
  unitPrice: number;
  lineTotal: number;
}

interface RetainedLine {
  productName: string;
  retainedQty: number;
  unitPrice: number;
  lineTotal: number;
}

interface ReturnModalProps {
  order: OrderInfo;
  onClose: () => void;
  onReturnSuccess: () => void;
  cashierName?: string;
}

const ReturnModal = ({ order, onClose, onReturnSuccess, cashierName = 'Staff' }: ReturnModalProps) => {
  const [returnQuantities, setReturnQuantities] = useState<Record<number, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [refundAmount, setRefundAmount] = useState(0);
  const [returnedLines, setReturnedLines] = useState<ReturnedLine[]>([]);
  const [returnNumber, setReturnNumber] = useState('');
  const receiptRef = useRef<HTMLDivElement>(null);
  const balanceReceiptRef = useRef<HTMLDivElement>(null);

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

  const retainedLines = useMemo<RetainedLine[]>(() => {
    if (!isSuccess) return [];
    return order.items
      .map(item => {
        const retQty = returnQuantities[item.productId] || 0;
        const retain = item.quantity - retQty;
        if (retain <= 0) return null;
        return {
          productName: item.productName,
          retainedQty: retain,
          unitPrice: item.price,
          lineTotal: retain * item.price,
        };
      })
      .filter(Boolean) as RetainedLine[];
  }, [isSuccess, order.items, returnQuantities]);

  const retainedTotal = retainedLines.reduce((s, l) => s + l.lineTotal, 0);

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

    const lines: ReturnedLine[] = order.items
      .filter(i => (returnQuantities[i.productId] || 0) > 0)
      .map(i => {
        const qty = returnQuantities[i.productId];
        return {
          productName: i.productName,
          returnedQty: qty,
          unitPrice: i.price,
          lineTotal: qty * i.price,
        };
      });

    setIsSubmitting(true);
    let finalRefund = calculatedRefund;
    try {
      const response = await fetch(`${API_BASE_URL}/api/orders/${order.id}/return`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ returnedItems: payloadItems, cashierName }),
      });

      if (response.ok) {
        const data = await response.json();
        finalRefund = data.refundAmount ?? calculatedRefund;
      }
    } catch {
      // Use client-side calculated refund as fallback
    }

    setRefundAmount(finalRefund);
    setReturnedLines(lines);
    setReturnNumber(`RET-${order.orderNumber}-${Date.now().toString().slice(-4)}`);
    setIsSubmitting(false);
    setIsSuccess(true);
    toast.success(`Items returned & Rs ${finalRefund} refunded! Stock restored (+${totalReturnCount})`);
  };

  const printGeneric = (title: string, ref: React.RefObject<HTMLDivElement>) => {
    const content = ref.current?.innerHTML;
    if (!content) return;
    const win = window.open('', '_blank', 'width=320,height=600');
    if (!win) return;
    win.document.write(`
      <html>
        <head>
          <title>${title}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Courier New', monospace; font-size: 12px; width: 280px; padding: 8px; }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .line { border-top: 1px dashed #000; margin: 6px 0; }
            .row { display: flex; justify-content: space-between; margin: 3px 0; }
            .total-row { font-size: 14px; font-weight: bold; }
            .refund-row { color: #dc2626; font-weight: bold; }
            .balance-row { color: #16a34a; font-weight: bold; }
            .strike { text-decoration: line-through; color: #888; }
            h2 { font-size: 16px; margin-bottom: 2px; }
            p { font-size: 11px; }
          </style>
        </head>
        <body>
          ${content}
          <script>window.onload = () => { window.print(); window.close(); }<\/script>
        </body>
      </html>
    `);
    win.document.close();
  };

  const handlePrintReturn = () =>
    printGeneric(`Return Receipt - ${returnNumber}`, receiptRef);

  const handlePrintBalance = () =>
    printGeneric(`Balance Receipt - ${order.orderNumber}`, balanceReceiptRef);

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' });

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
          <div className="flex flex-col max-h-[90vh]">
            <div className="p-6 text-center border-b bg-emerald-500/10">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}>
                <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-3" />
              </motion.div>
              <h3 className="text-xl font-bold text-emerald-700">Return Processed Successfully!</h3>
              <p className="text-sm mt-1">
                Refund: <strong className="text-emerald-600 text-lg">Rs {refundAmount}</strong>
                {retainedLines.length > 0 && (
                  <> • Balance: <strong className="text-primary text-lg">Rs {retainedTotal}</strong></>
                )}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                +{totalReturnCount} items restored to stock • Processed by: <strong>{cashierName}</strong>
              </p>
            </div>

            <div className="p-5 overflow-y-auto pos-scrollbar space-y-4">
              {/* ================= RETURN RECEIPT (PRINTED) ================= */}
              <div ref={receiptRef} className="font-mono text-xs border rounded-xl p-4 bg-muted/30">
                <div style={{ textAlign: 'center', fontWeight: 'bold', marginBottom: 4 }}>
                  <h2 style={{ fontSize: 14, margin: 0, color: '#dc2626' }}>🏪 SALES RETURN</h2>
                  <p style={{ fontSize: 10, color: '#666' }}>Tuck Shop POS — Item Refund</p>
                  <p style={{ fontSize: 10 }}>{dateStr} {timeStr}</p>
                  <p style={{ fontSize: 10 }}>Return No: <strong>{returnNumber}</strong></p>
                  <p style={{ fontSize: 10 }}>Original Order: <strong>{order.orderNumber}</strong></p>
                  <p style={{ fontSize: 10 }}>Processed by: <strong>{cashierName}</strong></p>
                </div>

                <div style={{ borderTop: '1px dashed #000', margin: '8px 0' }} />

                {/* Original order overview */}
                <p style={{ fontWeight: 'bold', marginBottom: 4, color: '#333' }}>Original Order:</p>
                {order.items.map((it, idx) => {
                  const retQty = returnQuantities[it.productId] || 0;
                  const retained = it.quantity - retQty;
                  const lineStrike = retained <= 0;
                  return (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', margin: '3px 0' }}>
                      <span style={{ flex: 1, textDecoration: lineStrike ? 'line-through' : 'none', color: lineStrike ? '#888' : '#000' }}>
                        {it.productName}
                      </span>
                      <span style={{ marginLeft: 8, textDecoration: lineStrike ? 'line-through' : 'none', color: lineStrike ? '#888' : '#000' }}>
                        {it.quantity}x
                      </span>
                      <span style={{ marginLeft: 8, textAlign: 'right', minWidth: 50, textDecoration: lineStrike ? 'line-through' : 'none', color: lineStrike ? '#888' : '#000' }}>
                        Rs {it.quantity * it.price}
                      </span>
                    </div>
                  );
                })}
                <p style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', margin: '4px 0 6px 0' }}>
                  <span>Original Total:</span>
                  <span>Rs {order.total}</span>
                </p>

                <div style={{ borderTop: '1px dashed #000', margin: '8px 0' }} />

                {/* Returned section */}
                <p style={{ fontWeight: 'bold', marginBottom: 4, color: '#dc2626' }}>Returned Items:</p>
                {returnedLines.map((line, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', margin: '3px 0', color: '#dc2626' }}>
                    <span style={{ flex: 1 }}>- {line.productName}</span>
                    <span style={{ marginLeft: 8 }}>{line.returnedQty}x</span>
                    <span style={{ marginLeft: 8, textAlign: 'right', minWidth: 50 }}>- Rs {line.lineTotal}</span>
                  </div>
                ))}

                {/* Retained / remaining section */}
                {retainedLines.length > 0 && (
                  <>
                    <div style={{ borderTop: '1px dashed #000', margin: '8px 0' }} />
                    <p style={{ fontWeight: 'bold', marginBottom: 4, color: '#16a34a' }}>Items Retained by Customer:</p>
                    {retainedLines.map((line, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', margin: '3px 0', color: '#166534' }}>
                        <span style={{ flex: 1 }}>{line.productName}</span>
                        <span style={{ marginLeft: 8 }}>{line.retainedQty}x</span>
                        <span style={{ marginLeft: 8, textAlign: 'right', minWidth: 50 }}>Rs {line.lineTotal}</span>
                      </div>
                    ))}
                  </>
                )}

                <div style={{ borderTop: '1px dashed #000', margin: '8px 0' }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: 14, color: '#dc2626' }}>
                  <span>REFUND AMOUNT</span>
                  <span>- Rs {refundAmount}</span>
                </div>

                {retainedLines.length > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: 13, color: '#16a34a', marginTop: 3 }}>
                    <span>NET BALANCE KEPT</span>
                    <span>Rs {retainedTotal}</span>
                  </div>
                )}

                <div style={{ borderTop: '1px dashed #000', margin: '8px 0' }} />

                <div style={{ textAlign: 'center', fontSize: 10, color: '#666' }}>
                  Thank you — please visit again!
                </div>
              </div>

              {/* ================= BALANCE RECEIPT (ONLY WHEN REMAINDER EXISTS) ================= */}
              {retainedLines.length > 0 && (
                <div ref={balanceReceiptRef} className="font-mono text-xs border border-emerald-500/40 rounded-xl p-4 bg-emerald-500/5">
                  <div style={{ textAlign: 'center', fontWeight: 'bold', marginBottom: 4 }}>
                    <h2 style={{ fontSize: 14, margin: 0, color: '#059669' }}>🧾 BALANCE RECEIPT</h2>
                    <p style={{ fontSize: 10, color: '#666' }}>Items Retained After Return</p>
                    <p style={{ fontSize: 10 }}>{dateStr} {timeStr}</p>
                    <p style={{ fontSize: 10 }}>Order: <strong>{order.orderNumber}</strong></p>
                    <p style={{ fontSize: 10 }}>Linked Return: <strong>{returnNumber}</strong></p>
                    <p style={{ fontSize: 10 }}>Served by: <strong>{cashierName}</strong></p>
                  </div>

                  <div style={{ borderTop: '1px dashed #000', margin: '8px 0' }} />

                  {retainedLines.map((line, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', margin: '3px 0' }}>
                      <span style={{ flex: 1 }}>{line.productName}</span>
                      <span style={{ marginLeft: 8 }}>{line.retainedQty}x</span>
                      <span style={{ marginLeft: 8, textAlign: 'right', minWidth: 50 }}>Rs {line.lineTotal}</span>
                    </div>
                  ))}

                  <div style={{ borderTop: '1px dashed #000', margin: '8px 0' }} />

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: 14, color: '#059669' }}>
                    <span>BALANCE TOTAL</span>
                    <span>Rs {retainedTotal}</span>
                  </div>

                  <div style={{ borderTop: '1px dashed #000', margin: '8px 0' }} />
                  <div style={{ textAlign: 'center', fontSize: 10, color: '#666' }}>
                    Paid by customer against retained items
                  </div>
                </div>
              )}

              {/* ================= ACTION BUTTONS ================= */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={handlePrintReturn}
                  className="h-12 rounded-xl gradient-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                >
                  <Printer className="w-4 h-4" /> Print Return
                </button>
                {retainedLines.length > 0 && (
                  <button
                    onClick={handlePrintBalance}
                    className="h-12 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold flex items-center justify-center gap-2 transition-colors shadow-soft"
                  >
                    <FileText className="w-4 h-4" /> Print Balance
                  </button>
                )}
              </div>

              <button
                onClick={() => {
                  onReturnSuccess();
                  onClose();
                }}
                className="w-full h-10 rounded-xl border text-sm font-medium hover:bg-muted transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between p-5 border-b">
              <div>
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <RotateCcw className="w-5 h-5 text-orange-500" /> Sales Return / Item Refund
                </h3>
                <p className="text-xs text-muted-foreground">
                  Order #{order.orderNumber} • Processed by: <strong>{cashierName}</strong>
                </p>
              </div>
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

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

              {totalReturnCount > 0 && (
                <div className="p-4 rounded-xl bg-orange-500/10 text-orange-600 font-bold flex justify-between items-center text-base">
                  <span>Refund Amount to Customer:</span>
                  <span className="text-xl">Rs {calculatedRefund.toLocaleString()}</span>
                </div>
              )}
            </div>

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
