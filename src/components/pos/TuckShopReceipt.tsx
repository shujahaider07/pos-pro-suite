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

    // Hidden iframe (popup + window.close() se spooler job toot jati thi)
    const iframe = document.createElement('iframe');
    iframe.style.cssText =
      'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      document.body.removeChild(iframe);
      return;
    }

    doc.open();
    doc.write(`
      <html>
        <head>
          <title>Receipt - ${orderNumber}</title>
          <style>
            /* Thermal printer ka paper size: 80mm width, height auto */
            @page { size: 80mm auto; margin: 0; }
            * { margin: 0; padding: 0; box-sizing: border-box; }
            html, body { width: 72mm; }
            body {
              font-family: 'Courier New', monospace;
              font-size: 13px;
              font-weight: 700;
              padding: 2mm;
              color: #000;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .center { text-align: center; }
            .bold { font-weight: 700; }
            .line { border-top: 2px solid #000; margin: 8px 0; }
            .row { display: flex; justify-content: space-between; margin: 4px 0; }
            .total-row { font-size: 16px; font-weight: 700; }
            h2 { font-size: 18px; margin-bottom: 2px; font-weight: 700; }
            p { font-size: 12px; font-weight: 700; }
            table { width: 100%; border-collapse: collapse; }
            th, td { font-size: 12px; font-weight: 700; padding: 2px 0; vertical-align: top; }
          </style>
        </head>
        <body>${printContent}</body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      // print dialog/spool hone ke baad iframe hata do
      setTimeout(() => {
        if (iframe.parentNode) document.body.removeChild(iframe);
      }, 1500);
    }, 300);
  };

  // Table cell styles (inline taake print mein bhi same rahein)
  const thStyle: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 700,
    padding: '2px 0',
    borderBottom: '2px solid #000',
  };
  const tdStyle: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 700,
    padding: '3px 0',
    verticalAlign: 'top',
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 backdrop-blur-sm p-2 sm:p-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-card rounded-2xl shadow-float w-full max-w-sm flex flex-col max-h-[92dvh] overflow-hidden"
      >
        {/* Header (fixed) */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b bg-emerald-500/10 shrink-0">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <div>
              <h3 className="font-bold text-sm text-emerald-700">Payment Successful!</h3>
              <p className="text-[10px] text-emerald-600/80 font-mono">Order {orderNumber}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-emerald-500/20 text-emerald-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Receipt Body (scrollable) */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-5">
          {/* Printable area */}
          <div ref={receiptRef} className="font-mono text-sm font-bold" style={{ color: '#000' }}>
            {/* Shop Header */}
            <div className="center bold" style={{ textAlign: 'center', fontWeight: '700', marginBottom: 6 }}>
              <h2 style={{ fontSize: 16, margin: 0, fontWeight: '700' }}>LIP SIP MART</h2>
              <p style={{ fontSize: 11, fontWeight: '700' }}>Quick & Easy Counter Sales</p>
              <p style={{ fontSize: 11, fontWeight: '700' }}>{dateStr} {timeStr}</p>
              <p style={{ fontSize: 11, fontWeight: '700' }}>Order: <strong>{orderNumber}</strong></p>
              <p style={{ fontSize: 11, fontWeight: '700' }}>Cashier: <strong>{cashierName}</strong></p>
              <p style={{ fontSize: 11, fontWeight: '700' }}>Contact no: <strong>0340-2224447</strong></p>
            </div>

            <div className="line" style={{ borderTop: '2px solid #000', margin: '8px 0' }} />

            {/* Items Table with Columns */}
            <table style={{ width: '100%', borderCollapse: 'collapse', color: '#000' }}>
              <thead>
                <tr>
                  <th style={{ ...thStyle, textAlign: 'left' }}>Product</th>
                  <th style={{ ...thStyle, textAlign: 'center', width: 30 }}>Qty</th>
                  <th style={{ ...thStyle, textAlign: 'right', width: 45 }}>Price</th>
                  <th style={{ ...thStyle, textAlign: 'right', width: 55 }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.product.id}>
                    <td style={{ ...tdStyle, textAlign: 'left', paddingRight: 4, wordBreak: 'break-word' }}>
                      {item.product.name}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>{item.quantity}</td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>{item.product.price}</td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>
                      {item.product.price * item.quantity}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="line" style={{ borderTop: '2px solid #000', margin: '8px 0' }} />

            {/* Tax breakdown */}
            <div className="row" style={{ display: 'flex', justifyContent: 'space-between', margin: '4px 0', fontWeight: '700' }}>
              <span style={{ fontSize: 12 }}>Subtotal</span>
              <span style={{ fontSize: 12 }}>Rs {subtotal}</span>
            </div>

            {taxRate > 0 && (
              <div className="row" style={{ display: 'flex', justifyContent: 'space-between', margin: '4px 0', fontWeight: '700' }}>
                <span style={{ fontSize: 12 }}>GST Tax ({taxRate}%)</span>
                <span style={{ fontSize: 12 }}>Rs {taxAmount}</span>
              </div>
            )}

            {/* Total */}
            <div
              className="row total-row"
              style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '700', fontSize: 16, marginTop: 6 }}
            >
              <span>GRAND TOTAL</span>
              <span>Rs {grandTotal}</span>
            </div>

            <div className="line" style={{ borderTop: '2px solid #000', margin: '8px 0' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', margin: '4px 0', fontSize: 12, fontWeight: '700' }}>
              <span>Payment</span>
              <span>{paymentMethod}</span>
            </div>

            {paymentMethod === 'Cash' && cashReceived && cashReceived > 0 && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', margin: '4px 0', fontSize: 12, fontWeight: '700' }}>
                  <span>Cash Received</span>
                  <span>Rs {cashReceived}</span>
                </div>
                {/* Thermal printer sirf black print karta hai, isliye green color hata diya */}
                <div style={{ display: 'flex', justifyContent: 'space-between', margin: '4px 0', fontSize: 12, fontWeight: '700', color: '#000' }}>
                  <span>Change</span>
                  <span>Rs {change >= 0 ? change : 0}</span>
                </div>
              </>
            )}

            <div className="line" style={{ borderTop: '2px solid #000', margin: '8px 0' }} />

            <div className="center" style={{ textAlign: 'center', fontSize: 11, fontWeight: '700' }}>
              Thank you for your purchase!
            </div>

            <div className="center" style={{ textAlign: 'center', fontSize: 10, fontWeight: '700', marginTop: 6 }}>
              powered by SYR
            </div>
            <div className="center" style={{ textAlign: 'center', fontSize: 10, fontWeight: '700' }}>
              Contact no: 0302-8921819
            </div>
          </div>
        </div>

        {/* Footer buttons (fixed, hamesha visible) */}
        <div className="shrink-0 border-t bg-card p-3 sm:p-4 space-y-2">
          <button
            onClick={handlePrint}
            className="w-full h-11 rounded-xl gradient-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
          >
            <Printer className="w-4 h-4" /> Print Receipt
          </button>
          <button
            onClick={onClose}
            className="w-full h-10 rounded-xl border text-sm font-medium hover:bg-muted transition-colors"
          >
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default TuckShopReceipt;