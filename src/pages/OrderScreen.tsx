import { useEffect, useState } from 'react';
import { useLocation, useParams, useNavigate, type Location } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, ArrowLeft, UtensilsCrossed } from 'lucide-react';
import type { CartItem, Product, Category, TableData } from '@/lib/mock-data';
import { useMutation, useQuery } from '@tanstack/react-query';
import ProductCard from '@/components/pos/ProductCard';
import CartPanel from '@/components/pos/CartPanel';
import PaymentModal from '@/components/pos/PaymentModal';
import KOTReceipt, { BillReceipt } from '@/components/pos/KOTReceipt';
import { toast } from 'sonner';

const OrderScreen = () => {
  const { tableId } = useParams();
  const navigate = useNavigate();
  const location = useLocation() as Location & { state?: { table?: TableData } };

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000';

  const { data: tableFromApi, isLoading: isTableLoading } = useQuery<TableData | null>({
    queryKey: ['table', tableId],
    queryFn: async () => {
      if (!tableId) return null;
      const response = await fetch(`${API_BASE_URL}/api/tables/${tableId}`);
      if (!response.ok) {
        throw new Error('Failed to load table');
      }
      return response.json();
    },
    enabled: !location.state?.table && !!tableId,
  });

  const table = (location.state?.table as TableData | undefined) ?? tableFromApi;

  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeSubcategory, setActiveSubcategory] = useState<string | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [elapsed] = useState(table?.elapsedMinutes || 0);
  const [showPayment, setShowPayment] = useState(false);
  const [showKOT, setShowKOT] = useState(false);
  const [showBill, setShowBill] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState<number | null>(null);
  const [currentOrderNumber, setCurrentOrderNumber] = useState<string | null>(null);

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/api/categories`);
      if (!response.ok) {
        throw new Error('Failed to load categories');
      }
      return response.json();
    },
  });

  const { data: products = [], isLoading: isProductsLoading } = useQuery<Product[]>({
    queryKey: ['products', activeCategory, activeSubcategory, search],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (activeCategory && activeCategory !== 'all') params.append('categoryId', activeCategory);
      if (activeSubcategory) params.append('subcategory', activeSubcategory);
      if (search) params.append('search', search);

      const queryString = params.toString();
      const response = await fetch(`${API_BASE_URL}/api/products${queryString ? `?${queryString}` : ''}`);
      if (!response.ok) {
        throw new Error('Failed to load products');
      }
      return response.json();
    },
  });

  type ActiveOrderItem = {
    productId: number;
    name: string;
    price: number;
    quantity: number;
  };

  type ActiveOrder = {
    id: number;
    tableId: number;
    status: string;
    orderNumber: string;
    items: ActiveOrderItem[];
  };

  const { data: activeOrder } = useQuery<ActiveOrder | null>({
    queryKey: ['activeOrder', table?.id],
    queryFn: async () => {
      if (!table?.id) return null;
      const response = await fetch(`${API_BASE_URL}/api/orders/active?tableId=${table.id}`);
      if (!response.ok) {
        throw new Error('Failed to load active order');
      }
      return response.json();
    },
    enabled: !!table?.id,
  });

  const currentCategory = categories.find(c => c.id === activeCategory);

  useEffect(() => {
    if (!activeOrder || !activeOrder.items || activeOrder.items.length === 0) return;
    if (cartItems.length > 0) return;
    if (isProductsLoading) return;

    setCurrentOrderId(activeOrder.id);
    setCurrentOrderNumber(activeOrder.orderNumber);

    const items: CartItem[] = activeOrder.items.map(item => {
      const matchedProduct = products.find(p => p.id === item.productId);
      const product: Product =
        matchedProduct ??
        {
          id: item.productId,
          name: item.name,
          price: item.price,
          category: 'unknown',
          image: '🍽️',
          available: true,
        };

      return {
        product,
        quantity: item.quantity,
      };
    });

    setCartItems(items);
  }, [activeOrder, cartItems, isProductsLoading, products]);

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

  const clearCart = () => {
    setCartItems([]);
    toast.info('Cart cleared');
  };

  type CreateOrderMode = 'payment' | 'hold';

  const updateOrderMutation = useMutation({
    mutationFn: async (orderId: number) => {
      if (!table) {
        throw new Error('Table not loaded');
      }
      if (cartItems.length === 0) {
        throw new Error('Cart is empty');
      }

      const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cartItems.map(item => ({
            productId: item.product.id,
            quantity: item.quantity,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update order');
      }
    },
    onError: () => {
      toast.error('Failed to update order');
    },
  });

  const createOrderMutation = useMutation({
    mutationFn: async (mode: CreateOrderMode) => {
      if (!table) {
        throw new Error('Table not loaded');
      }
      if (cartItems.length === 0) {
        throw new Error('Cart is empty');
      }

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

      if (!response.ok) {
        throw new Error('Failed to create order');
      }

      return response.json() as Promise<{ id: number; orderNumber?: string }>;
    },
    onSuccess: (data, mode) => {
      setCurrentOrderId(data.id);
      if (data.orderNumber) {
        setCurrentOrderNumber(data.orderNumber);
      }
      if (mode === 'payment') {
        setShowPayment(true);
        toast.success('Order created');
      }
      if (mode === 'hold') {
        holdOrderMutation.mutate(data.id);
      }
    },
    onError: () => {
      toast.error('Failed to create order');
    },
  });

  const completeOrderMutation = useMutation({
    mutationFn: async (orderId: number) => {
      const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}/complete`, {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Failed to complete order');
      }
    },
    onSuccess: () => {
      toast.success('Payment completed!');
      navigate('/tables');
    },
    onError: () => {
      toast.error('Failed to complete order');
    },
  });

  const holdOrderMutation = useMutation({
    mutationFn: async (orderId: number) => {
      const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}/hold`, {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Failed to hold order');
      }
    },
    onSuccess: () => {
      toast.info('Order held');
      navigate('/tables');
    },
    onError: () => {
      toast.error('Failed to hold order');
    },
  });

  const cancelOrderMutation = useMutation({
    mutationFn: async (orderId: number) => {
      const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}/cancel`, {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Failed to cancel order');
      }
    },
    onSuccess: () => {
      setCartItems([]);
      toast.error('Order cancelled');
      navigate('/tables');
    },
    onError: () => {
      toast.error('Failed to cancel order');
    },
  });

  const handleProceedPayment = async () => {
    if (currentOrderId) {
      try {
        await updateOrderMutation.mutateAsync(currentOrderId);
        setShowPayment(true);
      } catch {
        // error toast already shown in mutation
      }
    } else {
      createOrderMutation.mutate('payment');
    }
  };

  const handleHoldOrder = async () => {
    if (currentOrderId) {
      try {
        await updateOrderMutation.mutateAsync(currentOrderId);
        holdOrderMutation.mutate(currentOrderId);
      } catch {
        // error toast already shown in mutation
      }
    } else {
      createOrderMutation.mutate('hold');
    }
  };

  const handleCancelOrder = () => {
    if (currentOrderId) {
      cancelOrderMutation.mutate(currentOrderId);
    } else {
      setCartItems([]);
      toast.error('Order cancelled');
      navigate('/tables');
    }
  };

  if (!table || isTableLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-muted-foreground">
        Loading table...
      </div>
    );
  }

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
          {isProductsLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <Search className="w-10 h-10 mb-3 opacity-20" />
              <p className="text-sm">Loading items...</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {products.map(product => (
                  <ProductCard key={product.id} product={product} onAdd={addToCart} />
                ))}
              </div>
              {products.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                  <Search className="w-10 h-10 mb-3 opacity-20" />
                  <p className="text-sm">No items found</p>
                </div>
              )}
            </>
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
          onHoldOrder={handleHoldOrder}
          onProceedPayment={handleProceedPayment}
          onCancelOrder={handleCancelOrder}
          onClearCart={clearCart}
          elapsedMinutes={elapsed}
        />
      </div>

      {showPayment && (
        <PaymentModal
          total={cartItems.reduce((s, i) => s + i.product.price * i.quantity, 0)}
          onClose={() => setShowPayment(false)}
          onPreviewBill={() => {
            setShowBill(true);
          }}
          onConfirmPayment={() => {
            if (currentOrderId) {
              completeOrderMutation.mutate(currentOrderId, {
                onSuccess: () => {
                  toast.success('Payment completed!');
                },
                onError: () => {
                  toast.error('Failed to complete order');
                },
              });
            } else {
              toast.success('Payment completed!');
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

      {showBill && (
        <BillReceipt
          table={table}
          items={cartItems}
          orderNumber={currentOrderNumber}
          onClose={() => {
            setShowBill(false);
            setCartItems([]);
            navigate('/tables');
          }}
        />
      )}
    </div>
  );
};

export default OrderScreen;
