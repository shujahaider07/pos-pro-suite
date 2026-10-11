export interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  categoryId?: string;
  subcategory?: string;
  image: string;
  available: boolean;
  stockQuantity?: number;
  barcode?: string;
  productType?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  subcategories?: string[];
}

export interface StaffMember {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'employee' | 'manager' | 'cashier';
  phone?: string;
  shift?: string;
  status: 'active' | 'inactive';
}

export interface OrderRecord {
  id: number;
  orderNumber: string;
  status: 'Completed' | 'Active' | 'Cancelled';
  total: number;
  itemsCount: number;
  createdAt: string;
  paymentMethod: 'Cash' | 'Digital';
  cashierName?: string;
  items: { productName: string; quantity: number; price: number }[];
}

export interface TuckShopSettings {
  shopName: string;
  tagline: string;
  phone: string;
  email: string;
  address: string;
  currency: string;
  currencySymbol: string;
  taxRate: number;
  lowStockThreshold: number;
  receiptFooter: string;
}

export interface StockItem {
  id: number;
  name: string;
  image: string;
  stockQuantity: number;
  isLowStock: boolean;
  price: number;
}

export const initialCategories: Category[] = [
  { id: 'food', name: 'Food', icon: '🍕' },
  { id: 'drinks', name: 'Drinks', icon: '🥤' },
  { id: 'dessert', name: 'Dessert', icon: '🍦' },
  { id: 'snacks', name: 'Snacks', icon: '🍿' },
];
export const categories = initialCategories;

export const initialProducts: Product[] = [
  { id: 1, name: 'Fruit Chaat', price: 150, category: 'food', categoryId: 'food', image: '🥗', available: true, stockQuantity: 50, productType: 'Saleable' },
  { id: 2, name: 'Biryani', price: 250, category: 'food', categoryId: 'food', image: '🍛', available: true, stockQuantity: 30, productType: 'Saleable' },
  { id: 3, name: 'Burger', price: 200, category: 'food', categoryId: 'food', image: '🍔', available: true, stockQuantity: 25, productType: 'Saleable' },
  { id: 4, name: 'Pizza', price: 500, category: 'food', categoryId: 'food', image: '🍕', available: true, stockQuantity: 15, productType: 'Saleable' },
  { id: 5, name: 'Coca Cola', price: 80, category: 'drinks', categoryId: 'drinks', image: '🥤', available: true, stockQuantity: 100, productType: 'Saleable' },
  { id: 6, name: 'Mango Lassi', price: 120, category: 'drinks', categoryId: 'drinks', image: '🥭', available: true, stockQuantity: 40, productType: 'Saleable' },
  { id: 7, name: 'Green Tea', price: 90, category: 'drinks', categoryId: 'drinks', image: '🍵', available: true, stockQuantity: 60, productType: 'Saleable' },
  { id: 8, name: 'Ice Cream', price: 100, category: 'dessert', categoryId: 'dessert', image: '🍦', available: true, stockQuantity: 35, productType: 'Saleable' },
  { id: 9, name: 'Chocolate Cake', price: 180, category: 'dessert', categoryId: 'dessert', image: '🍰', available: true, stockQuantity: 20, productType: 'Saleable' },
  { id: 10, name: 'Popcorn', price: 60, category: 'snacks', categoryId: 'snacks', image: '🍿', available: true, stockQuantity: 80, productType: 'Saleable' },
  { id: 11, name: 'French Fries', price: 120, category: 'snacks', categoryId: 'snacks', image: '🍟', available: true, stockQuantity: 45, productType: 'Saleable' },
  { id: 12, name: 'Nachos', price: 150, category: 'snacks', categoryId: 'snacks', image: '🌽', available: true, stockQuantity: 30, productType: 'Saleable' },
];
export const products = initialProducts;

export interface TableData {
  id: number;
  name: string;
  capacity: number;
  status: 'available' | 'occupied' | 'reserved';
  orderId?: number;
  orderTotal?: number;
  elapsedMinutes?: number;
}

export const initialTables: TableData[] = Array.from({ length: 10 }, (_, i) => {
  const id = i + 1;
  const status = id <= 3 ? 'occupied' : id <= 8 ? 'reserved' : 'available';
  const occupied = status === 'occupied' ? {
    orderId: 1000 + id,
    orderTotal: 1500 + id * 200,
    elapsedMinutes: 30 + id * 10,
  } : {};
  return {
    id,
    name: `Table ${id}`,
    capacity: 4,
    status,
    ...occupied,
  };
});

export const initialStaff: StaffMember[] = [];
export const initialOrders: OrderRecord[] = [];

export const getStoredTaxRate = (): number => {
  try {
    const stored = localStorage.getItem('tuckshop_gst_rate');
    if (stored !== null) return Number(stored);
  } catch {}
  return 18; // Default 18% GST (configurable)
};

export const setStoredTaxRate = (rate: number) => {
  try {
    localStorage.setItem('tuckshop_gst_rate', String(rate));
  } catch {}
};

export const initialSettings: TuckShopSettings = {
  shopName: 'TuckShop POS',
  tagline: 'Quick & Easy Counter Sales',
  phone: '',
  email: '',
  address: '',
  currency: 'PKR',
  currencySymbol: 'Rs',
  taxRate: getStoredTaxRate(),
  lowStockThreshold: 5,
  receiptFooter: 'Thank you for your purchase!',
};
