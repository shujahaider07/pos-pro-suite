import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Banknote, CreditCard, QrCode, Loader2, CheckCircle2 } from 'lucide-react';

interface PaymentModalProps {
  total: number;
  onClose: () => void;
  onComplete: () => void;
}

type PaymentMethod = 'cash' | 'card' | 'qr';

const PaymentModal = ({ total, onClose, onComplete }: PaymentModalProps) => {
  const [method, setMethod] = useState<PaymentMethod>('cash');
  const [cashAmount, setCashAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const grandTotal = Math.round(total);
  const change = Number(cashAmount) - grandTotal;

  const quickAmounts = [500, 1000, 2000, 5000];

  const handleConfirm = async () => {
    setIsProcessing(true);
    await new Promise(r => setTimeout(r, 1500));
    setIsProcessing(false);
    setIsComplete(true);
    setTimeout(onComplete, 1500);
  };

  const methods = [
    { id: 'cash' as const, label: 'Cash', icon: Banknote },
    { id: 'card' as const, label: 'Card', icon: CreditCard },
    { id: 'qr' as const, label: 'QR Pay', icon: QrCode },
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
              <CheckCircle2 className="w-20 h-20 text-success mx-auto mb-4" />
            </motion.div>
            <h3 className="text-xl font-bold">Payment Successful!</h3>
            <p className="text-muted-foreground text-sm mt-2">Receipt is being generated...</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="font-bold text-lg">Payment</h3>
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              <div className="text-center py-4 rounded-xl bg-accent">
                <p className="text-sm text-muted-foreground">Grand Total</p>
                <p className="text-3xl font-bold text-gradient-primary">₹{grandTotal.toLocaleString()}</p>
              </div>

              {/* Methods */}
              <div className="flex gap-2">
                {methods.map(m => (
                  <button
                    key={m.id}
                    onClick={() => setMethod(m.id)}
                    className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                      method === m.id ? 'border-primary bg-accent' : 'border-transparent bg-muted hover:border-primary/20'
                    }`}
                  >
                    <m.icon className={`w-5 h-5 ${method === m.id ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className="text-xs font-medium">{m.label}</span>
                  </button>
                ))}
              </div>

              {/* Cash Input */}
              {method === 'cash' && (
                <div className="space-y-3">
                  <input
                    type="number"
                    value={cashAmount}
                    onChange={e => setCashAmount(e.target.value)}
                    placeholder="Enter amount received"
                    className="w-full h-14 text-center text-2xl font-bold rounded-xl border bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <div className="flex gap-2">
                    {quickAmounts.map(amt => (
                      <button
                        key={amt}
                        onClick={() => setCashAmount(String(amt))}
                        className="flex-1 py-2.5 rounded-xl border text-sm font-medium hover:border-primary/30 hover:bg-accent transition-all"
                      >
                        ₹{amt}
                      </button>
                    ))}
                  </div>
                  {change >= 0 && cashAmount && (
                    <div className="flex justify-between p-3 rounded-xl bg-success/10 text-success">
                      <span className="text-sm font-medium">Change</span>
                      <span className="font-bold">₹{change.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              )}

              {method === 'card' && (
                <div className="text-center py-8 text-muted-foreground">
                  <CreditCard className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Insert or tap card on terminal</p>
                </div>
              )}

              {method === 'qr' && (
                <div className="text-center py-8 text-muted-foreground">
                  <QrCode className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Scan QR code to pay</p>
                </div>
              )}

              <button
                onClick={handleConfirm}
                disabled={isProcessing || (method === 'cash' && change < 0)}
                className="w-full h-12 rounded-xl gradient-primary text-primary-foreground font-semibold shadow-elevated hover:shadow-float transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isProcessing ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</> : 'Confirm Payment'}
              </button>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
};

export default PaymentModal;
