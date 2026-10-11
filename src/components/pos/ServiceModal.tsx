import { motion } from 'framer-motion';
import { X, Utensils, ShoppingBag, Truck } from 'lucide-react';

interface ServiceModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (service: 'DineIn' | 'Takeaway' | 'Delivery') => void;
}

const ServiceModal = ({ open, onClose, onSelect }: ServiceModalProps) => {
  if (!open) return null;

  const options = [
    {
      id: 'DineIn' as const,
      label: 'Dine In',
      icon: Utensils,
      desc: 'Sit at a table and order',
      color: 'from-blue-500 to-blue-600',
    },
    {
      id: 'Takeaway' as const,
      label: 'Takeaway',
      icon: ShoppingBag,
      desc: 'Pick up and go',
      color: 'from-green-500 to-green-600',
    },
    {
      id: 'Delivery' as const,
      label: 'Delivery',
      icon: Truck,
      desc: 'Deliver to customer',
      color: 'from-orange-500 to-orange-600',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-card rounded-2xl shadow-float w-full max-w-md mx-4 overflow-hidden"
      >
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="font-bold text-lg">Select Service Type</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-3">
          {options.map(opt => {
            const Icon = opt.icon;
            return (
              <button
                key={opt.id}
                onClick={() => onSelect(opt.id)}
                className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-transparent hover:border-primary/40 hover:bg-accent/50 transition-all text-left"
              >
                <div
                  className={`w-14 h-14 rounded-xl bg-gradient-to-br ${opt.color} flex items-center justify-center text-white shadow-soft flex-shrink-0`}
                >
                  <Icon className="w-7 h-7" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-base">{opt.label}</p>
                  <p className="text-xs text-muted-foreground">{opt.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ServiceModal;