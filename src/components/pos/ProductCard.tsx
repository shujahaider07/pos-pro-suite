import { motion } from 'framer-motion';
import type { Product } from '@/lib/mock-data';

interface ProductCardProps {
  product: Product;
  onAdd: (product: Product) => void;
}

const ProductCard = ({ product, onAdd }: ProductCardProps) => {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.97 }}
      onClick={() => product.available && onAdd(product)}
      className={`relative bg-card rounded-2xl border p-4 cursor-pointer transition-all duration-200 hover:shadow-elevated group ${
        !product.available ? 'opacity-50 cursor-not-allowed' : ''
      }`}
    >
      {!product.available && (
        <span className="absolute top-3 right-3 px-2 py-0.5 rounded-md bg-destructive/10 text-destructive text-[10px] font-bold uppercase">
          Out of Stock
        </span>
      )}
      <div className="text-4xl mb-3 text-center py-4 rounded-xl bg-muted/50 group-hover:bg-accent transition-colors">
        {product.image}
      </div>
      <h4 className="font-semibold text-sm truncate">{product.name}</h4>
      <div className="flex items-center justify-between mt-2">
        <span className="font-bold text-primary">₨{product.price}</span>
        {product.available && (
          <span className="w-7 h-7 rounded-lg gradient-primary flex items-center justify-center text-primary-foreground text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity">
            +
          </span>
        )}
      </div>
    </motion.div>
  );
};

export default ProductCard;
