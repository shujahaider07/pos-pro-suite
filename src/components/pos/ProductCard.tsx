import { motion } from 'framer-motion';
import type { Product } from '@/lib/mock-data';

interface ProductCardProps {
  product: Product;
  onAdd: (product: Product) => void;
}

const ProductCard = ({ product, onAdd }: ProductCardProps) => {
  const stock = product.stockQuantity ?? 0;
  const outOfStock = !product.available || stock === 0;
  const lowStock = stock > 0 && stock <= 5;

  return (
    <motion.div
      whileHover={!outOfStock ? { y: -2 } : {}}
      whileTap={!outOfStock ? { scale: 0.97 } : {}}
      onClick={() => !outOfStock && onAdd(product)}
      className={`relative bg-card rounded-2xl border p-4 transition-all duration-200 group ${
        outOfStock
          ? 'opacity-50 cursor-not-allowed'
          : 'cursor-pointer hover:shadow-elevated'
      }`}
    >
      {/* Out of stock badge */}
      {outOfStock && (
        <span className="absolute top-3 right-3 px-2 py-0.5 rounded-md bg-destructive/10 text-destructive text-[10px] font-bold uppercase z-10">
          Out of Stock
        </span>
      )}

      {/* Low stock badge */}
      {!outOfStock && lowStock && (
        <span className="absolute top-3 right-3 px-2 py-0.5 rounded-md bg-orange-500/10 text-orange-500 text-[10px] font-bold uppercase z-10">
          Low: {stock}
        </span>
      )}

      {/* Stock count (normal) */}
      {!outOfStock && !lowStock && stock > 0 && (
        <span className="absolute top-3 right-3 px-2 py-0.5 rounded-md bg-muted text-muted-foreground text-[10px] font-medium z-10">
          {stock}
        </span>
      )}

      <div className="text-4xl mb-3 text-center py-4 rounded-xl bg-muted/50 group-hover:bg-accent transition-colors">
        {product.image}
      </div>
      <h4 className="font-semibold text-sm truncate">{product.name}</h4>
      <div className="flex items-center justify-between mt-2">
        <span className="font-bold text-primary">Rs {product.price}</span>
        {!outOfStock && (
          <span className="w-7 h-7 rounded-lg gradient-primary flex items-center justify-center text-primary-foreground text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity">
            +
          </span>
        )}
      </div>
    </motion.div>
  );
};

export default ProductCard;
