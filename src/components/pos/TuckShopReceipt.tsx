import { useRef } from 'react';
import { motion } from 'framer-motion';
import { X, Printer } from 'lucide-react';
import type { CartItem } from '@/lib/mock-data';

interface TuckShopReceiptProps {
  orderNumber: string;
  items: CartItem[];
  paymentMethod: 'Cash' | 'Digital';
  cashReceived?: number;
  onClose: () => void;
}

const TuckShopReceipt = ({ orderNumber, items, paymentMethod, cashReceived, onClose }: TuckShopReceiptProps) => {
  const receiptRef = useRef<HTMLDivElement>(null);

  const subtotal = items.reduce((s, i) => s + i.product.price * i.quantity, 0);
  const change = cashReceived ? cashReceived - subtotal : 0;
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
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Printer className="w-5 h-5 text-primary" /> Receipt
          </h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Receipt Body */}
        <div className="p-5">
          {/* Printable area */}
          <div ref={receiptRef} className="font-mono text-xs">
            {/* Shop Header */}
            <div className="center bold" style={{ textAlign: 'center', fontWeight: 'bold', marginBottom: 4 }}>
              <h2 style={{ fontSize: 14, margin: 0 }}>🛒 TUCK SHOP POS</h2>
              <p style={{ fontSize: 10, color: '#666' }}>Quick &amp; Easy Counter Sales</p>
              <p style={{ fontSize: 10 }}>{dateStr} {timeStr}</p>
              <p style={{ fontSize: 10 }}>Order: <strong>{orderNumber}</strong></p>
            </div>

            <div className="line" style={{ borderTop: '1px dashed #000', margin: '8px 0' }} />

            {/* Items */}
            {items.map((item) => (
              <div key={item.product.id} className="row" style={{ display: 'flex', justifyContent: 'space-between', margin: '3px 0' }}>
                <span style={{ flex: 1 }}>{item.product.name}</span>
                <span style={{ marginLeft: 8 }}>{item.quantity}x</span>
                <span style={{ marginLeft: 8, textAlign: 'right', minWidth: 50 }}>Rs {item.product.price * item.quantity}</span>
              </div>
            ))}

            <div className="line" style={{ borderTop: '1px dashed #000', margin: '8px 0' }} />

            {/* Total */}
            <div className="row total-row" style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: 13 }}>
              <span>TOTAL</span>
              <span>Rs {subtotal}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', margin: '3px 0', fontSize: 11 }}>
              <span>Payment</span>
              <span>{paymentMethod}</span>
            </div>

            {paymentMethod === 'Cash' && cashReceived && cashReceived > 0 && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', margin: '3px 0', fontSize: 11 }}>
                  <span>Cash Received</span>
                  <span>Rs {cashReceived}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', margin: '3px 0', fontSize: 11, color: '#16a34a', fontWeight: 'bold' }}>
                  <span>Change</span>
                  <span>Rs {change}</span>
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
