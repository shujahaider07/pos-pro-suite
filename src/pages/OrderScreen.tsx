import { useState, useMemo, useEffect } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, ArrowLeft, UtensilsCrossed } from 'lucide-react';
import { initialProducts, initialCategories, initialTables, type CartItem, type Product, type Category, type TableData } from '@/lib/mock-data';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import ProductCard from '@/components/pos/ProductCard';
import CartPanel from '@/components/pos/CartPanel';
import PaymentModal from '@/components/pos/PaymentModal';
import KOTReceipt from '@/components/pos/KOTReceipt';
import { toast } from 'sonner';

const OrderScreen = () => {
  const { tableId } = useParams();
  const navigate = useNavigate();
  const location = useLocation() as Location & { state?: { table?: TableData } };
  const queryClient = useQueryClient();

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000';

  const defaultTable = useMemo(() => {
    const numericId = Number(tableId);
    return initialTables.find(t => t.id === numericId) || {
      id: numericId || 1,
      name: `T${numericId || 1}`,
      status: 'available' as const,
      capacity: 4,
    };
  }, [tableId]);

  const { data: tableFromApi } = useQuery<TableData | null>({
    queryKey: ['table', tableId],
    queryFn: async () => {
      if (!tableId) return null;
      try {
        const response = await fetch(`${API_BASE_URL}/api/tables/${tableId}`);
        if (!response.ok) return null;
        return response.json();
      } catch {
        return null;
      }
    },
    enabled: !location.state?.table && !!tableId,
  });

  const table: TableData = (location.state?.table as TableData | undefined) ?? tableFromApi ?? defaultTable;

  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeSubcategory, setActiveSubcategory] = useState<string | null>(null);
  
  // Initialize cart from localStorage if this table had held items
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem(`restopos_held_table_${table.id}`);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {}
    return [];
  });
  
  const [elapsed] = useState(table?.elapsedMinutes || 0);
  const [showPayment, setShowPayment] = useState(false);
  const [showKOT, setShowKOT] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState<number | null>(null);

  // Check backend for existing held / active order on this table
  useEffect(() => {
    if (!table.id) return;
    fetch(`${API_BASE_URL}/api/orders/table/${table.id}`)
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (data && Array.isArray(data.items) && data.items.length > 0) {
          setCurrentOrderId(data.id);
          const mappedItems: CartItem[] = data.items.map((item: any) => ({
            product: item.product || {
              id: item.productId,
              name: item.productName || `Item #${item.productId}`,
              price: item.unitPrice || 250,
              category: 'mains',
              categoryId: 'mains',
              image: '🍽️',
              available: true,
            },
            quantity: item.quantity,
          }));
          setCartItems(mappedItems);
          localStorage.setItem(`restopos_held_table_${table.id}`, JSON.stringify(mappedItems));
        }
      })
      .catch(() => {});
  }, [table.id, API_BASE_URL]);

  const { data: categories = initialCategories } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/categories`);
        if (!response.ok) return initialCategories;
        const data = await response.json();
        return Array.isArray(data) && data.length > 0 ? data : initialCategories;
      } catch {
        return initialCategories;
      }
    },
    initialData: initialCategories,
  });

  const { data: productsFromApi = initialProducts, isLoading: isProductsLoading } = useQuery<Product[]>({
    queryKey: ['products', activeCategory, activeSubcategory, search],
    queryFn: async () => {
      try {
        const params = new URLSearchParams();
        if (activeCategory && activeCategory !== 'all') params.append('categoryId', activeCategory);
        if (activeSubcategory) params.append('subcategory', activeSubcategory);
        if (search) params.append('search', search);

        const queryString = params.toString();
        const response = await fetch(`${API_BASE_URL}/api/products${queryString ? `?${queryString}` : ''}`);
        if (!response.ok) return initialProducts;
        const data = await response.json();
        return Array.isArray(data) && data.length > 0 ? data : initialProducts;
      } catch {
        return initialProducts;
      }
    },
    initialData: initialProducts,
  });

  // Filter products locally if needed
  const displayProducts = useMemo(() => {
    let list = productsFromApi && productsFromApi.length > 0 ? productsFromApi : initialProducts;
    if (activeCategory && activeCategory !== 'all') {
      list = list.filter(p => (p.category === activeCategory || p.categoryId === activeCategory));
    }
    if (activeSubcategory) {
      list = list.filter(p => p.subcategory?.toLowerCase() === activeSubcategory.toLowerCase());
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q));
    }
    return list;
  }, [productsFromApi, activeCategory, activeSubcategory, search]);

  const currentCategory = categories.find(c => c.id === activeCategory);

  const addToCart = (product: Product) => {
    setCartItems(prev => {
      const existing = prev.find(i => i.product.id === product.id);
      if (existing) {
        return prev.map(i => (i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [...prev, { product, quantity: 1 }];
    });
    toast.success(`${product.name} added to cart`);
  };

  const updateQuantity = (productId: number, delta: number) => {
    setCartItems(prev =>
      prev
        .map(i => {
          if (i.product.id !== productId) return i;
          const newQty = i.quantity + delta;
          return newQty <= 0 ? null : { ...i, quantity: newQty };
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeItem = (productId: number) => {
    setCartItems(prev => prev.filter(i => i.product.id !== productId));
    toast.info('Item removed from cart');
  };

  const createOrderMutation = useMutation({
    mutationFn: async () => {
      if (!table) {
        throw new Error('Table not loaded');
      }
      if (cartItems.length === 0) {
        throw new Error('Cart is empty');
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/orders`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tableId: table.id,
            items: cartItems.map(item => ({
              productId: item.product.id,
              quantity: item.quantity,
            })),
          }),
        });

        if (response.ok) {
          return response.json() as Promise<{ id: number }>;
        }
      } catch {
        // Local fallback
      }
      return { id: Math.floor(Math.random() * 9000) + 1000 };
    },
    onSuccess: data => {
      setCurrentOrderId(data.id);
      setShowPayment(true);
      toast.success('Order ready for payment');
    },
    onError: () => {
      setShowPayment(true);
    },
  });

  const completeOrderMutation = useMutation({
    mutationFn: async (orderId: number) => {
      try {
        await fetch(`${API_BASE_URL}/api/orders/${orderId}/complete`, {
          method: 'POST',
        });
      } catch {
        // Local mode
      }
    },
    onSuccess: () => {
      localStorage.removeItem(`restopos_held_table_${table.id}`);
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      toast.success('Payment completed successfully!');
      navigate('/tables');
    },
    onError: () => {
      localStorage.removeItem(`restopos_held_table_${table.id}`);
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      toast.success('Payment recorded');
      navigate('/tables');
    },
  });

  const holdOrderMutation = useMutation({
    mutationFn: async (orderId: number) => {
      try {
        await fetch(`${API_BASE_URL}/api/orders/${orderId}/hold`, {
          method: 'POST',
        });
      } catch {
        // Local mode
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      toast.info('Order placed on Hold');
      navigate('/tables');
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      toast.info('Order placed on Hold');
      navigate('/tables');
    },
  });

  const cancelOrderMutation = useMutation({
    mutationFn: async (orderId: number) => {
      try {
        await fetch(`${API_BASE_URL}/api/orders/${orderId}/cancel`, {
          method: 'POST',
        });
      } catch {
        // Local mode
      }
    },
    onSuccess: () => {
      localStorage.removeItem(`restopos_held_table_${table.id}`);
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      setCartItems([]);
      toast.error('Order cancelled');
      navigate('/tables');
    },
    onError: () => {
      localStorage.removeItem(`restopos_held_table_${table.id}`);
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      setCartItems([]);
      toast.error('Order cancelled');
      navigate('/tables');
    },
  });

  const handleProceedPayment = () => {
    if (cartItems.length === 0) {
      toast.error('Please add items to cart before proceeding to payment');
      return;
    }
    if (currentOrderId) {
      setShowPayment(true);
    } else {
      createOrderMutation.mutate();
    }
  };

  const handleHoldOrder = async () => {
    if (cartItems.length === 0) {
      toast.error('Cart is empty');
      return;
    }
    // Save to local storage for persistence across reloads and table visits
    localStorage.setItem(`restopos_held_table_${table.id}`, JSON.stringify(cartItems));

    try {
      if (currentOrderId) {
        await fetch(`${API_BASE_URL}/api/orders/${currentOrderId}/hold`, { method: 'POST' });
      } else {
        await fetch(`${API_BASE_URL}/api/orders`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tableId: table.id,
            status: 'Held',
            items: cartItems.map(item => ({
              productId: item.product.id,
              quantity: item.quantity,
            })),
          }),
        });
      }
    } catch {}

    queryClient.invalidateQueries({ queryKey: ['tables'] });
    toast.info(`Order for Table ${table.name} placed on Hold ⏸️`);
    navigate('/tables');
  };

  const handleCancelOrder = () => {
    localStorage.removeItem(`restopos_held_table_${table.id}`);
    if (currentOrderId) {
      cancelOrderMutation.mutate(currentOrderId);
    } else {
      setCartItems([]);
      toast.error('Order cancelled');
      navigate('/tables');
    }
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Left - Products & Menu */}
      <div className="flex-1 flex flex-col min-w-0 border-r" style={{ width: '65%' }}>
        {/* Top Bar */}
        <div className="px-6 py-4 bg-card/80 backdrop-blur-xl border-b flex items-center gap-4">
          <button
            onClick={() => navigate('/tables')}
            className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="Back to Tables"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center text-primary-foreground shadow-soft">
              <UtensilsCrossed className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-base">Table {table.name}</span>
              <span className="block text-[10px] text-muted-foreground">{table.capacity} Seats</span>
            </div>
          </div>
          <div className="flex-1 relative ml-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search dishes, drinks, pizzas..."
              className="w-full h-10 pl-10 pr-4 rounded-xl border bg-muted/40 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            />
          </div>
        </div>

        {/* Categories Carousel */}
        <div className="px-6 py-3 border-b bg-card">
          <div className="flex gap-2 overflow-x-auto pos-scrollbar pb-1">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => {
                  setActiveCategory(cat.id);
                  setActiveSubcategory(null);
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                  activeCategory === cat.id
                    ? 'gradient-primary text-primary-foreground shadow-soft'
                    : 'bg-muted/60 border hover:border-primary/30 text-muted-foreground hover:text-foreground'
                }`}
              >
                <span>{cat.icon}</span>
                {cat.name}
              </button>
            ))}
          </div>
          {/* Subcategories */}
          {currentCategory?.subcategories && currentCategory.subcategories.length > 0 && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="flex gap-2 mt-2 pt-2 border-t overflow-x-auto pos-scrollbar">
              <button
                onClick={() => setActiveSubcategory(null)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  !activeSubcategory ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                All
              </button>
              {currentCategory.subcategories.map(sub => (
                <button
                  key={sub}
                  onClick={() => setActiveSubcategory(sub)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                    activeSubcategory === sub ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
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
          {displayProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <Search className="w-10 h-10 mb-3 opacity-20" />
              <p className="text-sm font-semibold">No food items found</p>
              <p className="text-xs text-muted-foreground mt-1">Try another category or search keyword</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {displayProducts.map(product => (
                <ProductCard key={product.id} product={product} onAdd={addToCart} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right - Live Cart Panel */}
      <div className="w-[35%] min-w-[340px]">
        <CartPanel
          table={table}
          items={cartItems}
          onUpdateQuantity={updateQuantity}
          onRemoveItem={removeItem}
          onPrintKOT={() => {
            if (cartItems.length === 0) {
              toast.error('Cart is empty! Add items to print KOT.');
              return;
            }
            setShowKOT(true);
          }}
          onHoldOrder={handleHoldOrder}
          onProceedPayment={handleProceedPayment}
          onCancelOrder={handleCancelOrder}
          elapsedMinutes={elapsed}
        />
      </div>

      {showPayment && (
        <PaymentModal
          total={cartItems.reduce((s, i) => s + i.product.price * i.quantity, 0) * 1.07}
          onClose={() => setShowPayment(false)}
          onComplete={() => {
            if (currentOrderId) {
              completeOrderMutation.mutate(currentOrderId);
            } else {
              toast.success('Payment completed!');
              navigate('/tables');
            }
            setShowPayment(false);
          }}
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

