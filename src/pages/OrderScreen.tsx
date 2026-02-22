import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, ArrowLeft, UtensilsCrossed } from 'lucide-react';
import { products, categories, tables, type CartItem, type Product } from '@/lib/mock-data';
import ProductCard from '@/components/pos/ProductCard';
import CartPanel from '@/components/pos/CartPanel';
import PaymentModal from '@/components/pos/PaymentModal';
import KOTReceipt from '@/components/pos/KOTReceipt';
import { toast } from 'sonner';

const OrderScreen = () => {
  const { tableId } = useParams();
  const navigate = useNavigate();
  const table = tables.find(t => t.id === Number(tableId)) || tables[0];

  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeSubcategory, setActiveSubcategory] = useState<string | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [elapsed, setElapsed] = useState(table.elapsedMinutes || 0);
  const [showPayment, setShowPayment] = useState(false);
  const [showKOT, setShowKOT] = useState(false);

  const currentCategory = categories.find(c => c.id === activeCategory);

  const filteredProducts = useMemo(() => {
    let list = products;
    if (activeCategory !== 'all') list = list.filter(p => p.category === activeCategory);
    if (activeSubcategory) list = list.filter(p => p.subcategory === activeSubcategory);
    if (search) list = list.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
    return list;
  }, [activeCategory, activeSubcategory, search]);

  const addToCart = (product: Product) => {
    setCartItems(prev => {
      const existing = prev.find(i => i.product.id === product.id);
      if (existing) return prev.map(i => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { product, quantity: 1 }];
    });
    toast.success(`${product.name} added`);
  };

  const updateQuantity = (productId: number, delta: number) => {
    setCartItems(prev => prev.map(i => {
      if (i.product.id !== productId) return i;
      const newQty = i.quantity + delta;
      return newQty <= 0 ? i : { ...i, quantity: newQty };
    }));
  };

  const removeItem = (productId: number) => {
    setCartItems(prev => prev.filter(i => i.product.id !== productId));
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Left - Products */}
      <div className="flex-1 flex flex-col min-w-0" style={{ width: '65%' }}>
        {/* Top Bar */}
        <div className="px-6 py-4 bg-card/80 backdrop-blur-xl border-b flex items-center gap-4">
          <button onClick={() => navigate('/tables')} className="p-2 rounded-xl hover:bg-muted transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <UtensilsCrossed className="w-4 h-4 text-primary" />
            <span className="font-bold">Table {table.name}</span>
          </div>
          <div className="flex-1 relative ml-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search menu..."
              className="w-full h-10 pl-10 pr-4 rounded-xl border bg-muted/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="px-6 py-3 border-b">
          <div className="flex gap-2 overflow-x-auto pos-scrollbar pb-1">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => { setActiveCategory(cat.id); setActiveSubcategory(null); }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                  activeCategory === cat.id
                    ? 'gradient-primary text-primary-foreground shadow-soft'
                    : 'bg-card border hover:border-primary/30 text-muted-foreground hover:text-foreground'
                }`}
              >
                <span>{cat.icon}</span>
                {cat.name}
              </button>
            ))}
          </div>
          {/* Subcategories */}
          {currentCategory?.subcategories && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="flex gap-2 mt-2 overflow-x-auto pos-scrollbar">
              <button
                onClick={() => setActiveSubcategory(null)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  !activeSubcategory ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                All
              </button>
              {currentCategory.subcategories.map(sub => (
                <button
                  key={sub}
                  onClick={() => setActiveSubcategory(sub)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    activeSubcategory === sub ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {sub}
                </button>
              ))}
            </motion.div>
          )}
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto pos-scrollbar p-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProducts.map(product => (
              <ProductCard key={product.id} product={product} onAdd={addToCart} />
            ))}
          </div>
          {filteredProducts.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <Search className="w-10 h-10 mb-3 opacity-20" />
              <p className="text-sm">No items found</p>
            </div>
          )}
        </div>
      </div>

      {/* Right - Cart */}
      <div className="w-[35%] min-w-[340px]">
        <CartPanel
          table={table}
          items={cartItems}
          onUpdateQuantity={updateQuantity}
          onRemoveItem={removeItem}
          onPrintKOT={() => setShowKOT(true)}
          onHoldOrder={() => { toast.info('Order held'); navigate('/tables'); }}
          onProceedPayment={() => setShowPayment(true)}
          onCancelOrder={() => { setCartItems([]); toast.error('Order cancelled'); navigate('/tables'); }}
          elapsedMinutes={elapsed}
        />
      </div>

      {showPayment && (
        <PaymentModal
          total={cartItems.reduce((s, i) => s + i.product.price * i.quantity, 0) * 1.07}
          onClose={() => setShowPayment(false)}
          onComplete={() => { setShowPayment(false); toast.success('Payment completed!'); navigate('/tables'); }}
        />
      )}

      {showKOT && (
        <KOTReceipt
          table={table}
          items={cartItems}
          onClose={() => setShowKOT(false)}
        />
      )}
    </div>
  );
};

export default OrderScreen;
