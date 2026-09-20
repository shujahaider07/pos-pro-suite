import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Banknote, CreditCard, Loader2, CheckCircle2 } from 'lucide-react';

interface PaymentModalProps {
  total: number;
  onClose: () => void;
  onComplete: (method: 'Cash' | 'Digital', cashReceived?: number) => void;
}

type PaymentMethod = 'Cash' | 'Digital';

const PaymentModal = ({ total, onClose, onComplete }: PaymentModalProps) => {
  const [method, setMethod] = useState<PaymentMethod>('Cash');
  const [cashAmount, setCashAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const grandTotal = Math.round(total);
  const received = Number(cashAmount) || 0;
  const change = received - grandTotal;

  // Quick cash note buttons for Pakistan (PKR / Rs)
  const quickAmounts = [50, 100, 500, 1000, 5000];

  const handleConfirm = async () => {
    setIsProcessing(true);
    await new Promise(r => setTimeout(r, 600));
    setIsProcessing(false);
    setIsComplete(true);
    setTimeout(() => {
      onComplete(method, method === 'Cash' ? received : undefined);
    }, 800);
  };

  const methods = [
    { id: 'Cash' as const,    label: 'Cash',    icon: Banknote },
    { id: 'Digital' as const, label: 'Digital', icon: CreditCard },
  ];

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
        className="bg-card rounded-2xl shadow-float w-full max-w-md mx-4 overflow-hidden"
      >
        {isComplete ? (
          <div className="p-12 text-center">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}>
              <CheckCircle2 className="w-20 h-20 text-emerald-500 mx-auto mb-4" />
            </motion.div>
            <h3 className="text-xl font-bold">Payment Successful!</h3>
            <p className="text-muted-foreground text-sm mt-2">Printing receipt...</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="font-bold text-lg">Collect Payment</h3>
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              <div className="text-center py-4 rounded-xl bg-accent">
                <p className="text-xs text-muted-foreground uppercase font-semibold">Total Amount Due</p>
                <p className="text-3xl font-bold text-gradient-primary">Rs {grandTotal.toLocaleString()}</p>
              </div>

              {/* Method Selector */}
              <div className="flex gap-2">
                {methods.map(m => (
                  <button
                    key={m.id}
                    onClick={() => setMethod(m.id)}
                    className={`flex-1 flex items-center justify-center gap-2 p-3.5 rounded-xl border-2 transition-all font-semibold text-sm ${
                      method === m.id
                        ? 'border-primary bg-accent text-primary'
                        : 'border-transparent bg-muted hover:border-primary/20 text-muted-foreground'
                    }`}
                  >
                    <m.icon className="w-4 h-4" />
                    <span>{m.label}</span>
                  </button>
                ))}
              </div>

              {/* Cash Options */}
              {method === 'Cash' && (
                <div className="space-y-3">
                  <label className="text-xs font-semibold text-muted-foreground block">Cash Given by Customer</label>
                  <input
                    type="number"
                    value={cashAmount}
                    onChange={e => setCashAmount(e.target.value)}
                    placeholder="Enter cash received..."
                    className="w-full h-14 text-center text-2xl font-bold rounded-xl border bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/40"
                    autoFocus
                  />

                  {/* Quick PKR buttons */}
                  <div className="flex gap-1.5 overflow-x-auto pos-scrollbar pb-1">
                    {quickAmounts.map(amt => (
                      <button
                        key={amt}
                        onClick={() => setCashAmount(String(amt))}
                        className="flex-1 py-2 rounded-xl border text-xs font-bold hover:border-primary/40 hover:bg-accent transition-all"
                      >
                        Rs {amt}
                      </button>
                    ))}
                    <button
                      onClick={() => setCashAmount(String(grandTotal))}
                      className="px-3 py-2 rounded-xl border border-primary/40 bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 transition-all"
                    >
                      Exact
                    </button>
                  </div>

                  {/* Change Output */}
                  {received > 0 && (
                    <div
                      className={`flex justify-between items-center p-3.5 rounded-xl font-bold ${
                        change >= 0 ? 'bg-emerald-500/10 text-emerald-600' : 'bg-destructive/10 text-destructive'
                      }`}
                    >
                      <span className="text-sm">{change >= 0 ? 'Return Change to Customer:' : 'Short Amount:'}</span>
                      <span className="text-lg">Rs {Math.abs(change).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              )}

              {method === 'Digital' && (
                <div className="text-center py-6 text-muted-foreground rounded-xl border-2 border-dashed bg-muted/30">
                  <CreditCard className="w-10 h-10 mx-auto mb-2 opacity-40 text-primary" />
                  <p className="text-sm font-semibold">Digital Payment / Card / QR</p>
                  <p className="text-xs text-muted-foreground mt-1">Collect payment via POS card machine or EasyPaisa/JazzCash QR</p>
                </div>
              )}

              <button
                onClick={handleConfirm}
                disabled={isProcessing || (method === 'Cash' && received > 0 && change < 0)}
                className="w-full h-12 rounded-xl gradient-primary text-primary-foreground font-bold shadow-elevated hover:shadow-float transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
                ) : (
                  `Confirm ${method} Payment`
                )}
              </button>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
};

export default PaymentModal;
