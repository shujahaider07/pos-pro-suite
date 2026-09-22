import { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, ShoppingBag, Barcode, Trash2, ArrowLeft, Plus, Minus, RotateCcw, X, User } from 'lucide-react';
import { initialProducts, initialCategories, getStoredTaxRate, type CartItem, type Product, type Category } from '@/lib/mock-data';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/pos-context';
import ProductCard from '@/components/pos/ProductCard';
import PaymentModal from '@/components/pos/PaymentModal';
import TuckShopReceipt from '@/components/pos/TuckShopReceipt';
import ReturnModal from '@/components/pos/ReturnModal';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/config/api';

const OrderScreen = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { userName, role, email } = useAuth();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeSubcategory, setActiveSubcategory] = useState<string | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [showPayment, setShowPayment] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptItems, setReceiptItems] = useState<CartItem[]>([]);
  const [showRecentSalesModal, setShowRecentSalesModal] = useState(false);
  const [selectedReturnOrder, setSelectedReturnOrder] = useState<any | null>(null);
  const [currentOrderId, setCurrentOrderId] = useState<number | null>(null);
  const [lastOrderNumber, setLastOrderNumber] = useState('');
  const [lastPaymentMethod, setLastPaymentMethod] = useState<'Cash' | 'Digital'>('Cash');
  const [lastCashReceived, setLastCashReceived] = useState<number | undefined>(undefined);

  // Custom Item Modal State
  const [showCustomItemModal, setShowCustomItemModal] = useState(false);
  const [customItemName, setCustomItemName] = useState('');
  const [customItemPrice, setCustomItemPrice] = useState('');

  // Order Return Search State
  const [returnOrderSearch, setReturnOrderSearch] = useState('');

  // Auto-focus helper to ensure barcode scanner is always ready
  const focusSearchInput = () => {
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 50);
  };

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
      image: '📦',
      available: true,
      stockQuantity: 999,
    };

    setCartItems(prev => [...prev, { product: customProduct, quantity: 1 }]);
    setShowCustomItemModal(false);
    setCustomItemName('');
    setCustomItemPrice('');
    toast.success(`Added open item: ${customProduct.name} (Rs ${price})`);
    focusSearchInput();
  };

  // Fetch recent orders for return lookup (filtered by current cashier if employee)
  const { data: recentOrders = [] } = useQuery({
    queryKey: ['orders', userName, role],
    queryFn: async () => {
      try {
        const params = new URLSearchParams();
        if (role !== 'admin' && userName) {
          params.append('cashier', userName);
        }
        if (role) {
          params.append('role', role);
        }
        const res = await fetch(`${API_BASE_URL}/api/orders${params.toString() ? '?' + params.toString() : ''}`);
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

  // Global listener: Always keep barcode search focused when no modal is open
  useEffect(() => {
    focusSearchInput();

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (showPayment || showReceipt || showRecentSalesModal || showCustomItemModal || selectedReturnOrder) {
        return;
      }

      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
        return;
      }

      if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [showPayment, showReceipt, showRecentSalesModal, showCustomItemModal, selectedReturnOrder]);

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

        const response = await fetch(`${API_BASE_URL}/api/products${params.toString() ? '?' + params.toString() : ''}`);
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
      focusSearchInput();
      return;
    }

    setCartItems(prev => {
      const existing = prev.find(i => i.product.id === product.id);
      if (existing) {
        if (product.stockQuantity !== undefined && existing.quantity >= product.stockQuantity) {
          toast.error(`Cannot add more. Only ${product.stockQuantity} in stock.`);
          return prev;
        }
        return prev.map(i => (i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [...prev, { product, quantity: 1 }];
    });

    toast.success(`${product.name} added to cart`);
    focusSearchInput();
  };

  // Barcode Scanner Listener
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const rawQuery = search.trim();
      if (!rawQuery) return;

      const q = rawQuery.toLowerCase();

      // 1. Search exact barcode match
      const matchedBarcode = productsFromApi.find(
        p => p.barcode && p.barcode.trim().toLowerCase() === q
      );

      // 2. Search exact name match
      const matchedName = !matchedBarcode ? productsFromApi.find(
        p => p.name.trim().toLowerCase() === q
      ) : null;

      const matched = matchedBarcode || matchedName || (displayProducts.length === 1 ? displayProducts[0] : null);

      if (matched) {
        addToCart(matched);
        setSearch('');
      } else {
        toast.error(`No item found with barcode/name "${rawQuery}"`);
        setSearch('');
      }
      focusSearchInput();
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
    focusSearchInput();
  };

  const removeItem = (productId: number) => {
    setCartItems(prev => prev.filter(i => i.product.id !== productId));
    toast.info('Item removed');
    focusSearchInput();
  };

  const handleProceedPayment = () => {
    if (cartItems.length === 0) {
      toast.error('Cart is empty');
      focusSearchInput();
      return;
    }
    setShowPayment(true);
  };

  const handlePaymentSuccess = async (method: 'Cash' | 'Digital', cashReceived?: number) => {
    setLastPaymentMethod(method);
    setLastCashReceived(cashReceived);
    setReceiptItems([...cartItems]);

    let generatedOrderNumber = `TK-${Date.now().toString().slice(-4)}`;

    try {
      const response = await fetch(`${API_BASE_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentMethod: method,
          cashierName: userName || 'Staff',
          cashierEmail: email || '',
          items: cartItems.map(item => ({
            productId: item.product.id > 0 ? item.product.id : 0,
            quantity: item.quantity,
            customName: item.product.id < 0 ? item.product.name : null,
            customPrice: item.product.id < 0 ? item.product.price : null,
          })),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.orderNumber) {
          generatedOrderNumber = data.orderNumber;
        }
        if (data.id) {
          setCurrentOrderId(data.id);
          try {
            await fetch(`${API_BASE_URL}/api/orders/${data.id}/complete`, { method: 'POST' });
          } catch (err) {
            console.error('Failed to complete order:', err);
          }
        }
      }

      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['stock'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    } catch (err) {
      console.error('Order creation error:', err);
    }

    setLastOrderNumber(generatedOrderNumber);
    setShowPayment(false);
    setShowReceipt(true);
    toast.success('Sale completed successfully! 🎉');
  };

  const handleClearOrder = () => {
    setCartItems([]);
    setReceiptItems([]);
    setCurrentOrderId(null);
    focusSearchInput();
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
              🏪
            </div>
            <div>
              <span className="font-bold text-base leading-none block">TuckShop POS</span>
              <span className="text-[10px] text-muted-foreground">Counter Sales</span>
            </div>
          </div>

          {/* Active Cashier Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 border border-primary/20 text-xs font-bold text-primary">
            <User className="w-3.5 h-3.5" />
            <span>Cashier: {userName || 'Staff'}</span>
          </div>

          {/* Barcode / Search Box */}
          <div className="flex-1 relative ml-2">
            <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary animate-pulse" />
            <input
              ref={searchInputRef}
              type="text"
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Scan barcode or type item name & press Enter..."
              className="w-full h-10 pl-10 pr-4 rounded-xl border bg-muted/40 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all font-mono"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCustomItemModal(true)}
              className="h-10 px-3 rounded-xl border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 text-xs font-bold transition-all flex items-center gap-1.5"
              title="Add Custom Unlisted Item"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Custom Item</span>
            </button>
            <button
              onClick={() => setShowRecentSalesModal(true)}
              className="h-10 px-3 rounded-xl border border-orange-500/30 bg-orange-500/10 text-orange-600 hover:bg-orange-500/20 text-xs font-bold transition-all flex items-center gap-1.5"
              title="Lookup your sales for return"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Sales Return</span>
            </button>
          </div>
        </div>

        {/* Categories Bar */}
        <div className="px-6 py-3 border-b flex gap-2 overflow-x-auto pos-scrollbar bg-card/40">
          <button
            onClick={() => {
              setActiveCategory('all');
              setActiveSubcategory(null);
              focusSearchInput();
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeCategory === 'all'
                ? 'gradient-primary text-primary-foreground shadow-soft'
                : 'bg-muted hover:bg-accent text-muted-foreground'
            }`}
          >
            All Items
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => {
                setActiveCategory(cat.id);
                setActiveSubcategory(null);
                focusSearchInput();
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeCategory === cat.id
                  ? 'gradient-primary text-primary-foreground shadow-soft'
                  : 'bg-muted hover:bg-accent text-muted-foreground'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.name}</span>
            </button>
          ))}
        </div>

        {/* Subcategories (if available) */}
        {currentCategory?.subcategories && currentCategory.subcategories.length > 0 && (
          <div className="px-6 py-2 border-b flex gap-2 overflow-x-auto pos-scrollbar bg-muted/20">
            <button
              onClick={() => {
                setActiveSubcategory(null);
                focusSearchInput();
              }}
              className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${
                activeSubcategory === null ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              All
            </button>
            {currentCategory.subcategories.map(sub => (
              <button
                key={sub}
                onClick={() => {
                  setActiveSubcategory(sub);
                  focusSearchInput();
                }}
                className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${
                  activeSubcategory === sub ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {sub}
              </button>
            ))}
          </div>
        )}

        {/* Product Grid */}
        <div className="flex-1 p-6 overflow-y-auto pos-scrollbar">
          {displayProducts.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
              <ShoppingBag className="w-12 h-12 mb-2 opacity-30" />
              <p className="font-semibold text-sm">No products found</p>
              <p className="text-xs mt-1">Try another search or add a custom item</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {displayProducts.map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAdd={() => addToCart(product)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Cart & Checkout */}
      <div className="flex flex-col bg-card border-l h-screen" style={{ width: '35%' }}>
        {/* Cart Header */}
        <div className="p-5 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-primary" />
            <h2 className="font-bold text-lg">Current Sale</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
              {cartItems.reduce((s, i) => s + i.quantity, 0)}
            </span>
          </div>
          {cartItems.length > 0 && (
            <button
              onClick={handleClearOrder}
              className="text-xs font-bold text-destructive hover:underline"
            >
              Clear All
            </button>
          )}
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 pos-scrollbar">
          {cartItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-center p-6">
              <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-3">
                <ShoppingBag className="w-8 h-8 opacity-40" />
              </div>
              <p className="font-bold text-sm">Cart is empty</p>
              <p className="text-xs text-muted-foreground mt-1">Scan a barcode or click items to add them to current sale</p>
            </div>
          ) : (
            cartItems.map(item => (
              <motion.div
                key={item.product.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-xl border bg-card/60 flex items-center justify-between gap-3 shadow-sm"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-xs truncate">{item.product.name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    Rs {item.product.price} each • <strong className="text-foreground">Rs {item.product.price * item.quantity}</strong>
                  </p>
                </div>
                <div className="flex items-center gap-1.5 bg-muted rounded-lg p-1">
                  <button
                    onClick={() => updateQuantity(item.product.id, -1)}
                    className="w-6 h-6 rounded flex items-center justify-center hover:bg-card text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-6 text-center text-xs font-bold">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.product.id, 1)}
                    className="w-6 h-6 rounded flex items-center justify-center hover:bg-card text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
                <button
                  onClick={() => removeItem(item.product.id)}
                  className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
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
          onClose={() => {
            setShowPayment(false);
            focusSearchInput();
          }}
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
          cashierName={userName || 'Staff'}
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
              <div>
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <RotateCcw className="w-5 h-5 text-orange-500" /> Select Order to Return
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  Showing sales for cashier: <strong className="text-foreground">{userName || 'Staff'}</strong>
                </p>
              </div>
              <button onClick={() => { setShowRecentSalesModal(false); focusSearchInput(); }} className="p-1 rounded-lg hover:bg-muted">
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
                  {returnOrderSearch.trim() ? `No matching order found for "${returnOrderSearch}"` : 'No previous sales found for this cashier.'}
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
                        {new Date(ord.createdAt).toLocaleTimeString()} • {ord.paymentMethod} • <span className="font-medium text-primary">{ord.cashierName || 'Staff'}</span>
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
                📦 Add Custom / Unlisted Item
              </h3>
              <button onClick={() => { setShowCustomItemModal(false); focusSearchInput(); }} className="p-1 rounded-lg hover:bg-muted">
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
          onClose={() => {
            setSelectedReturnOrder(null);
            focusSearchInput();
          }}
          onReturnSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            queryClient.invalidateQueries({ queryKey: ['products'] });
            queryClient.invalidateQueries({ queryKey: ['stock'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
            focusSearchInput();
          }}
        />
      )}
    </div>
  );
};

export default OrderScreen;
