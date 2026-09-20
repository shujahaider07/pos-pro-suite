import { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, ShoppingBag, Barcode, Trash2, ArrowLeft, Plus, Minus, RotateCcw, X } from 'lucide-react';
import { initialProducts, initialCategories, getStoredTaxRate, type CartItem, type Product, type Category } from '@/lib/mock-data';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import ProductCard from '@/components/pos/ProductCard';
import PaymentModal from '@/components/pos/PaymentModal';
import TuckShopReceipt from '@/components/pos/TuckShopReceipt';
import ReturnModal from '@/components/pos/ReturnModal';
import { toast } from 'sonner';

const OrderScreen = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5001';

  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeSubcategory, setActiveSubcategory] = useState<string | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [showPayment, setShowPayment] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptItems, setReceiptItems] = useState<CartItem[]>([]);
  const [showRecentSalesModal, setShowRecentSalesModal] = useState(false);
  const [selectedReturnOrder, setSelectedReturnOrder] = useState<any | null>(null);
  const [lastOrderNumber, setLastOrderNumber] = useState('');
  const [lastPaymentMethod, setLastPaymentMethod] = useState<'Cash' | 'Digital'>('Cash');
  const [lastCashReceived, setLastCashReceived] = useState<number | undefined>(undefined);
  // Custom Item Modal State
  const [showCustomItemModal, setShowCustomItemModal] = useState(false);
  const [customItemName, setCustomItemName] = useState('');
  const [customItemPrice, setCustomItemPrice] = useState('');

  // Order Return Search State
  const [returnOrderSearch, setReturnOrderSearch] = useState('');

  const handleAddCustomItem = () => {
    const price = Number(customItemPrice);
    if (!customItemName.trim() || isNaN(price) || price <= 0) {
      toast.error('Please enter a valid item name and price.');
      return;
    }

    const customProduct: Product = {
      id: -Date.now(),
      name: customItemName.trim(),
      price: price,
      category: 'all',
      image: '🏷️',
      available: true,
      stockQuantity: 999,
    };

    setCartItems(prev => [...prev, { product: customProduct, quantity: 1 }]);
    setShowCustomItemModal(false);
    setCustomItemName('');
    setCustomItemPrice('');
    toast.success(`Added open item: ${customProduct.name} (Rs ${price})`);
  };

  // Fetch recent orders for return lookup
  const { data: recentOrders = [] } = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/orders`);
        if (!res.ok) return [];
        return res.json();
      } catch {
        return [];
      }
    },
  });

  const filteredReturnOrders = useMemo(() => {
    if (!returnOrderSearch.trim()) return recentOrders;
    const q = returnOrderSearch.toLowerCase().trim();
    return recentOrders.filter((ord: any) =>
      (ord.orderNumber && ord.orderNumber.toLowerCase().includes(q)) ||
      (ord.id && ord.id.toString().includes(q))
    );
  }, [recentOrders, returnOrderSearch]);

  // Focus search input on mount so barcode scanner works immediately
  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  // Fetch Categories
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

  // Fetch Products & Stock
  const { data: productsFromApi = initialProducts } = useQuery<Product[]>({
    queryKey: ['products', activeCategory, activeSubcategory, search],
    queryFn: async () => {
      try {
        const params = new URLSearchParams();
        if (activeCategory && activeCategory !== 'all') params.append('categoryId', activeCategory);
        if (activeSubcategory) params.append('subcategory', activeSubcategory);
        if (search) params.append('search', search);

        const response = await fetch(`${API_BASE_URL}/api/products${params.toString() ? `?${params.toString()}` : ''}`);
        if (!response.ok) return initialProducts;
        const data = await response.json();
        return Array.isArray(data) && data.length > 0 ? data : initialProducts;
      } catch {
        return initialProducts;
      }
    },
    initialData: initialProducts,
  });

  // Filter products locally
  const displayProducts = useMemo(() => {
    let list = productsFromApi && productsFromApi.length > 0 ? productsFromApi : initialProducts;
    if (activeCategory && activeCategory !== 'all') {
      list = list.filter(p => p.category === activeCategory || p.categoryId === activeCategory);
    }
    if (activeSubcategory) {
      list = list.filter(p => p.subcategory?.toLowerCase() === activeSubcategory.toLowerCase());
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.barcode && p.barcode.includes(q))
      );
    }
    return list;
  }, [productsFromApi, activeCategory, activeSubcategory, search]);

  const currentCategory = categories.find(c => c.id === activeCategory);

  // Add item to cart
  const addToCart = (product: Product) => {
    if (!product.available || (product.stockQuantity !== undefined && product.stockQuantity <= 0)) {
      toast.error(`${product.name} is out of stock!`);
      return;
    }

    setCartItems(prev => {
      const existing = prev.find(i => i.product.id === product.id);
      if (existing) {
        // Stock check
        if (product.stockQuantity !== undefined && existing.quantity >= product.stockQuantity) {
          toast.error(`Cannot add more. Only ${product.stockQuantity} in stock.`);
          return prev;
        }
        return prev.map(i => (i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [...prev, { product, quantity: 1 }];
    });

    toast.success(`${product.name} added to cart`);
  };

  // Barcode Scanner Listener — auto adds to cart when exact barcode is scanned or Enter is pressed
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && search.trim()) {
      const query = search.trim();
      // Try exact barcode match first
      const matched = productsFromApi.find(
        p => p.barcode === query || p.name.toLowerCase() === query.toLowerCase()
      );
      if (matched) {
        addToCart(matched);
        setSearch('');
      } else if (displayProducts.length === 1) {
        addToCart(displayProducts[0]);
        setSearch('');
      }
    }
  };

  const updateQuantity = (productId: number, delta: number) => {
    setCartItems(prev =>
      prev
        .map(i => {
          if (i.product.id !== productId) return i;
          const newQty = i.quantity + delta;
          if (delta > 0 && i.product.stockQuantity !== undefined && newQty > i.product.stockQuantity) {
            toast.error(`Stock limit reached (${i.product.stockQuantity} available)`);
            return i;
          }
          return newQty <= 0 ? null : { ...i, quantity: newQty };
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeItem = (productId: number) => {
    setCartItems(prev => prev.filter(i => i.product.id !== productId));
    toast.info('Item removed');
  };

  const createOrderMutation = useMutation({
    mutationFn: async (paymentMethod: string) => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/orders`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paymentMethod,
            items: cartItems.map(item => ({
              productId: item.product.id > 0 ? item.product.id : 0,
              quantity: item.quantity,
              customName: item.product.id < 0 ? item.product.name : null,
              customPrice: item.product.id < 0 ? item.product.price : null,
            })),
          }),
        });
        if (response.ok) {
          return response.json() as Promise<{ id: number; orderNumber: string }>;
        }
      } catch {}
      return { id: Math.floor(Math.random() * 9000) + 1000, orderNumber: `TK-${Date.now().toString().slice(-4)}` };
    },
    onSuccess: data => {
      setCurrentOrderId(data.id);
      setLastOrderNumber(data.orderNumber);
    },
  });

  const completeOrderMutation = useMutation({
    mutationFn: async (orderId: number) => {
      try {
        await fetch(`${API_BASE_URL}/api/orders/${orderId}/complete`, { method: 'POST' });
      } catch {}
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['stock'] });
    },
  });

  const handleProceedPayment = () => {
    if (cartItems.length === 0) {
      toast.error('Cart is empty');
      return;
    }
    createOrderMutation.mutate('Cash');
    setShowPayment(true);
  };

  const handlePaymentSuccess = (method: 'Cash' | 'Digital', cashReceived?: number) => {
    setLastPaymentMethod(method);
    setLastCashReceived(cashReceived);
    setReceiptItems([...cartItems]);

    if (currentOrderId) {
      completeOrderMutation.mutate(currentOrderId);
    }

    setShowPayment(false);
    setShowReceipt(true);
    toast.success('Sale completed successfully! 🎉');
  };

  const handleClearOrder = () => {
    setCartItems([]);
    setCurrentOrderId(null);
    searchInputRef.current?.focus();
  };

  const taxRate = getStoredTaxRate();
  const subtotal = cartItems.reduce((s, i) => s + i.product.price * i.quantity, 0);
  const taxAmount = Math.round((subtotal * taxRate) / 100);
  const grandTotal = subtotal + taxAmount;

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Left Column: Products & Menu */}
      <div className="flex-1 flex flex-col min-w-0 border-r" style={{ width: '65%' }}>
        {/* Top Header & Barcode Search */}
        <div className="px-6 py-4 bg-card/80 backdrop-blur-xl border-b flex items-center gap-4">
          <button
            onClick={() => navigate('/admin')}
            className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="Admin Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center text-primary-foreground font-bold shadow-soft">
              🛒
            </div>
            <div>
              <span className="font-bold text-base leading-none block">TuckShop POS</span>
              <span className="text-[10px] text-muted-foreground">Counter Sales</span>
            </div>
          </div>

          {/* Barcode / Search Box */}
          <div className="flex-1 relative ml-4">
            <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary animate-pulse" />
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Scan Barcode or type item name... (Press Enter to add)"
              className="w-full h-11 pl-10 pr-4 rounded-xl border bg-muted/40 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
            />
          </div>

          {/* Custom Open Item Sale Button */}
          <button
            onClick={() => setShowCustomItemModal(true)}
            className="px-3.5 h-11 rounded-xl gradient-primary text-primary-foreground text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap shadow-soft hover:opacity-95"
            title="Sell item without barcode / unlisted item"
          >
            <Plus className="w-4 h-4" /> Custom Item
          </button>

          {/* Quick Returns Button */}
          <button
            onClick={() => setShowRecentSalesModal(true)}
            className="px-3.5 h-11 rounded-xl border border-orange-500/30 text-orange-500 hover:bg-orange-500/10 text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap shadow-soft"
            title="Sales Return & Refunds"
          >
            <RotateCcw className="w-4 h-4" /> Returns
          </button>
        </div>

        {/* Categories Bar */}
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
                  !activeSubcategory ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}
              >
                All
              </button>
              {currentCategory.subcategories.map(sub => (
                <button
                  key={sub}
                  onClick={() => setActiveSubcategory(sub)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                    activeSubcategory === sub ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
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
              <p className="text-sm font-semibold">No items found</p>
              <p className="text-xs mt-1">Try scanning barcode or typing name</p>
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

      {/* Right Column: Cart Panel */}
      <div className="w-[35%] min-w-[340px] flex flex-col bg-card border-l">
        <div className="p-5 border-b flex items-center justify-between">
          <div>
            <h2 className="font-bold text-lg flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-primary" /> Current Cart
            </h2>
            <p className="text-xs text-muted-foreground">{cartItems.reduce((s, i) => s + i.quantity, 0)} items</p>
          </div>
          {cartItems.length > 0 && (
            <button
              onClick={handleClearOrder}
              className="text-xs text-destructive hover:bg-destructive/10 px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1 font-medium"
            >
              <Trash2 className="w-3.5 h-3.5" /> Clear Cart
            </button>
          )}
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto pos-scrollbar p-4 space-y-2">
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-16">
              <ShoppingBag className="w-12 h-12 mb-3 opacity-20" />
              <p className="text-sm font-medium">Cart is empty</p>
              <p className="text-xs mt-1 text-center max-w-[200px]">Scan a barcode or click items on the left to add</p>
            </div>
          ) : (
            cartItems.map(item => (
              <motion.div
                key={item.product.id}
                layout
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20, height: 0 }}
                className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 group"
              >
                <span className="text-2xl">{item.product.image}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{item.product.name}</p>
                  <p className="text-xs text-muted-foreground">Rs {item.product.price} each</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => updateQuantity(item.product.id, -1)}
                    className="w-7 h-7 rounded-lg border flex items-center justify-center hover:bg-muted transition-colors"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-6 text-center text-sm font-bold">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.product.id, 1)}
                    className="w-7 h-7 rounded-lg border flex items-center justify-center hover:bg-muted transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
                <span className="text-sm font-bold w-16 text-right">Rs {item.product.price * item.quantity}</span>
                <button
                  onClick={() => removeItem(item.product.id)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            ))
          )}
        </div>

        {/* Footer & Payment Action */}
        {cartItems.length > 0 && (
          <div className="border-t p-5 space-y-3">
            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>Rs {subtotal.toLocaleString()}</span>
              </div>
              {taxRate > 0 && (
                <div className="flex justify-between text-muted-foreground font-medium">
                  <span>GST Tax ({taxRate}%)</span>
                  <span>Rs {taxAmount.toLocaleString()}</span>
                </div>
              )}
            </div>
            <div className="flex justify-between items-center font-bold text-xl border-t pt-2">
              <span>Grand Total</span>
              <span className="text-gradient-primary">Rs {grandTotal.toLocaleString()}</span>
            </div>
            <button
              onClick={handleProceedPayment}
              className="w-full h-13 rounded-xl gradient-primary text-primary-foreground font-bold text-base shadow-elevated hover:shadow-float transition-all flex items-center justify-center gap-2"
            >
              💳 Collect Payment (Rs {grandTotal.toLocaleString()})
            </button>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {showPayment && (
        <PaymentModal
          total={grandTotal}
          onClose={() => setShowPayment(false)}
          onComplete={handlePaymentSuccess}
        />
      )}

      {/* Thermal Receipt Modal */}
      {showReceipt && (
        <TuckShopReceipt
          orderNumber={lastOrderNumber || `TK-${Date.now().toString().slice(-4)}`}
          items={receiptItems.length > 0 ? receiptItems : cartItems}
          paymentMethod={lastPaymentMethod}
          cashReceived={lastCashReceived}
          taxRate={taxRate}
          onClose={() => {
            setShowReceipt(false);
            handleClearOrder();
          }}
        />
      )}

      {/* Recent Sales / Return Lookup Modal */}
      {showRecentSalesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 backdrop-blur-sm">
          <div className="bg-card rounded-2xl p-6 w-full max-w-md border shadow-float space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-orange-500" /> Select Order to Return
              </h3>
              <button onClick={() => setShowRecentSalesModal(false)} className="p-1 rounded-lg hover:bg-muted">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Receipt Number Search Box */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={returnOrderSearch}
                onChange={e => setReturnOrderSearch(e.target.value)}
                placeholder="Type or scan Receipt No (e.g. TK-1001)..."
                className="w-full h-10 pl-9 pr-4 rounded-xl border bg-muted/40 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                autoFocus
              />
            </div>

            <div className="max-h-72 overflow-y-auto pos-scrollbar space-y-2">
              {filteredReturnOrders.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-8">
                  No matching order found for "{returnOrderSearch}"
                </p>
              ) : (
                filteredReturnOrders.map((ord: any) => (
                  <div
                    key={ord.id}
                    onClick={() => {
                      if (ord.status === 'Returned') {
                        toast.error('This order has already been fully returned.');
                        return;
                      }
                      setSelectedReturnOrder(ord);
                      setShowRecentSalesModal(false);
                    }}
                    className={`p-3.5 rounded-xl border text-sm cursor-pointer transition-all hover:border-orange-500/50 hover:bg-orange-500/5 flex justify-between items-center ${
                      ord.status === 'Returned' ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <div>
                      <p className="font-bold text-base">{ord.orderNumber}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(ord.createdAt).toLocaleTimeString()} • {ord.paymentMethod}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary">Rs {ord.total}</p>
                      <span className="text-[10px] text-orange-500 font-bold uppercase">
                        {ord.status === 'Returned' ? 'Fully Returned' : 'Click to Return'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Custom Open Item Modal */}
      {showCustomItemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 backdrop-blur-sm">
          <div className="bg-card rounded-2xl p-6 w-full max-w-sm border shadow-float space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-lg flex items-center gap-2">
                🏷️ Add Custom / Unlisted Item
              </h3>
              <button onClick={() => setShowCustomItemModal(false)} className="p-1 rounded-lg hover:bg-muted">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3 text-xs font-semibold">
              <div>
                <label className="block text-muted-foreground mb-1">Item Name</label>
                <input
                  type="text"
                  value={customItemName}
                  onChange={e => setCustomItemName(e.target.value)}
                  placeholder="e.g. Special Biscuit / Unlisted Item"
                  className="w-full h-11 px-3 rounded-xl border bg-muted/40 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-muted-foreground mb-1">Price (Rs)</label>
                <input
                  type="number"
                  value={customItemPrice}
                  onChange={e => setCustomItemPrice(e.target.value)}
                  placeholder="Enter price..."
                  className="w-full h-11 px-3 rounded-xl border bg-muted/40 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>
            <button
              onClick={handleAddCustomItem}
              className="w-full h-11 rounded-xl gradient-primary text-primary-foreground font-bold text-sm hover:opacity-90 transition-opacity"
            >
              Add to Cart
            </button>
          </div>
        </div>
      )}

      {/* Sales Return Modal */}
      {selectedReturnOrder && (
        <ReturnModal
          order={selectedReturnOrder}
          onClose={() => setSelectedReturnOrder(null)}
          onReturnSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            queryClient.invalidateQueries({ queryKey: ['products'] });
            queryClient.invalidateQueries({ queryKey: ['stock'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
          }}
        />
      )}
    </div>
  );
};

export default OrderScreen;
