import { useRef } from 'react';
import { motion } from 'framer-motion';
import { X, Printer, CheckCircle2 } from 'lucide-react';
import { getStoredTaxRate, type CartItem } from '@/lib/mock-data';

interface TuckShopReceiptProps {
  orderNumber: string;
  items: CartItem[];
  paymentMethod: 'Cash' | 'Digital';
  cashReceived?: number;
  taxRate?: number;
  cashierName?: string;
  onClose: () => void;
}

const TuckShopReceipt = ({
  orderNumber,
  items,
  paymentMethod,
  cashReceived,
  taxRate = getStoredTaxRate(),
  cashierName = 'Staff',
  onClose,
}: TuckShopReceiptProps) => {
  const receiptRef = useRef<HTMLDivElement>(null);

  const subtotal = items.reduce((s, i) => s + i.product.price * i.quantity, 0);
  const taxAmount = Math.round((subtotal * taxRate) / 100);
  const grandTotal = subtotal + taxAmount;
  const change = cashReceived ? cashReceived - grandTotal : 0;

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' });

  const handlePrint = () => {
    const printContent = receiptRef.current?.innerHTML;
    if (!printContent) return;
    const win = window.open('', '_blank', 'width=320,height=600');
    if (!win) return;
    win.document.write(`
      <html>
        <head>
          <title>Receipt - ${orderNumber}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Courier New', monospace; font-size: 12px; width: 280px; padding: 8px; }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .line { border-top: 1px dashed #000; margin: 6px 0; }
            .row { display: flex; justify-content: space-between; margin: 3px 0; }
            .total-row { font-size: 14px; font-weight: bold; }
            h2 { font-size: 16px; margin-bottom: 2px; }
            p { font-size: 11px; }
          </style>
        </head>
        <body>
          ${printContent}
          <script>window.onload = () => { window.print(); window.close(); }<\/script>
        </body>
      </html>
    `);
    win.document.close();
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
        className="bg-card rounded-2xl shadow-float w-full max-w-sm mx-4 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-emerald-500/10">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <div>
              <h3 className="font-bold text-sm text-emerald-700">Payment Successful!</h3>
              <p className="text-[10px] text-emerald-600/80 font-mono">Order {orderNumber}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-emerald-500/20 text-emerald-800 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Receipt Body */}
        <div className="p-5">
          {/* Printable area */}
          <div ref={receiptRef} className="font-mono text-xs">
            {/* Shop Header */}
            <div className="center bold" style={{ textAlign: 'center', fontWeight: 'bold', marginBottom: 4 }}>
              <h2 style={{ fontSize: 14, margin: 0 }}>🏪 TUCK SHOP POS</h2>
              <p style={{ fontSize: 10, color: '#666' }}>Quick &amp; Easy Counter Sales</p>
              <p style={{ fontSize: 10 }}>{dateStr} {timeStr}</p>
              <p style={{ fontSize: 10 }}>Order: <strong>{orderNumber}</strong></p>
              <p style={{ fontSize: 10 }}>Cashier: <strong>{cashierName}</strong></p>
            </div>

            <div className="line" style={{ borderTop: '1px dashed #000', margin: '8px 0' }} />

            {/* Items */}
            {items.map((item) => (
              <div key={item.product.id} className="row" style={{ display: 'flex', justify: 'space-between', margin: '3px 0' }}>
                <span style={{ flex: 1 }}>{item.product.name}</span>
                <span style={{ marginLeft: 8 }}>{item.quantity}x</span>
                <span style={{ marginLeft: 8, textAlign: 'right', minWidth: 50 }}>Rs {item.product.price * item.quantity}</span>
              </div>
            ))}

            <div className="line" style={{ borderTop: '1px dashed #000', margin: '8px 0' }} />

            {/* Tax breakdown */}
            <div className="row" style={{ display: 'flex', justify: 'space-between', margin: '3px 0' }}>
              <span>Subtotal</span>
              <span>Rs {subtotal}</span>
            </div>

            {taxRate > 0 && (
              <div className="row" style={{ display: 'flex', justify: 'space-between', margin: '3px 0' }}>
                <span>GST Tax ({taxRate}%)</span>
                <span>Rs {taxAmount}</span>
              </div>
            )}

            {/* Total */}
            <div className="row total-row" style={{ display: 'flex', justify: 'space-between', fontWeight: 'bold', fontSize: 14, marginTop: 4 }}>
              <span>GRAND TOTAL</span>
              <span>Rs {grandTotal}</span>
            </div>

            <div className="line" style={{ borderTop: '1px dashed #000', margin: '8px 0' }} />

            <div style={{ display: 'flex', justify: 'space-between', margin: '3px 0', fontSize: 11 }}>
              <span>Payment</span>
              <span>{paymentMethod}</span>
            </div>

            {paymentMethod === 'Cash' && cashReceived && cashReceived > 0 && (
              <>
                <div style={{ display: 'flex', justify: 'space-between', margin: '3px 0', fontSize: 11 }}>
                  <span>Cash Received</span>
                  <span>Rs {cashReceived}</span>
                </div>
                <div style={{ display: 'flex', justify: 'space-between', margin: '3px 0', fontSize: 11, color: '#16a34a', fontWeight: 'bold' }}>
                  <span>Change</span>
                  <span>Rs {change >= 0 ? change : 0}</span>
                </div>
              </>
            )}

            <div className="line" style={{ borderTop: '1px dashed #000', margin: '8px 0' }} />

            <div className="center" style={{ textAlign: 'center', fontSize: 10, color: '#666' }}>
              Thank you for your purchase!
            </div>
          </div>

          {/* Print Button */}
          <button
            onClick={handlePrint}
            className="mt-5 w-full h-12 rounded-xl gradient-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
          >
            <Printer className="w-4 h-4" /> Print Receipt
          </button>
          <button
            onClick={onClose}
            className="mt-2 w-full h-10 rounded-xl border text-sm font-medium hover:bg-muted transition-colors"
          >
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default TuckShopReceipt;
