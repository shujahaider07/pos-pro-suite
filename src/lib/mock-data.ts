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

export const initialCategories: Category[] = [];
export const categories = initialCategories;

export const initialProducts: Product[] = [];
export const products = initialProducts;

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
