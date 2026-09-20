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
  phone: string;
  shift: string;
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
  { id: 'all',          name: 'All Items',  icon: '🛒' },
  { id: 'snacks',       name: 'Snacks',     icon: '🍟', subcategories: ['Chips', 'Nuts', 'Noodles'] },
  { id: 'drinks',       name: 'Drinks',     icon: '🥤', subcategories: ['Cold', 'Hot', 'Energy'] },
  { id: 'biscuits',     name: 'Biscuits',   icon: '🍪', subcategories: ['Cream', 'Plain'] },
  { id: 'stationery',   name: 'Stationery', icon: '✏️', subcategories: ['Pens', 'Notebooks', 'Erasers'] },
  { id: 'dairy',        name: 'Dairy',      icon: '🥛', subcategories: ['Milk', 'Yogurt'] },
  { id: 'confectionery',name: 'Sweets',     icon: '🍬', subcategories: ['Chocolate', 'Candy', 'Gum'] },
];

export const categories = initialCategories;

export const initialProducts: Product[] = [
  { id: 1,  name: 'Lays Classic',       price: 30,  category: 'snacks',        categoryId: 'snacks',       subcategory: 'Chips',     image: '🥔', available: true,  stockQuantity: 50, barcode: '8901234560001' },
  { id: 2,  name: 'Kurkure Masala',     price: 20,  category: 'snacks',        categoryId: 'snacks',       subcategory: 'Chips',     image: '🌽', available: true,  stockQuantity: 60, barcode: '8901234560002' },
  { id: 3,  name: 'Pringles Original',  price: 150, category: 'snacks',        categoryId: 'snacks',       subcategory: 'Chips',     image: '🍟', available: true,  stockQuantity: 20, barcode: '8901234560003' },
  { id: 4,  name: 'Peanuts Salted',     price: 25,  category: 'snacks',        categoryId: 'snacks',       subcategory: 'Nuts',      image: '🥜', available: true,  stockQuantity: 40, barcode: '8901234560004' },
  { id: 5,  name: 'Indomie Noodles',    price: 35,  category: 'snacks',        categoryId: 'snacks',       subcategory: 'Noodles',   image: '🍜', available: true,  stockQuantity: 30, barcode: '8901234560005' },
  { id: 6,  name: 'Coca Cola 500ml',    price: 60,  category: 'drinks',        categoryId: 'drinks',       subcategory: 'Cold',      image: '🥤', available: true,  stockQuantity: 48, barcode: '5449000000996' },
  { id: 7,  name: 'Pepsi 500ml',        price: 60,  category: 'drinks',        categoryId: 'drinks',       subcategory: 'Cold',      image: '🥤', available: true,  stockQuantity: 36, barcode: '4890008100309' },
  { id: 8,  name: 'Mineral Water',      price: 30,  category: 'drinks',        categoryId: 'drinks',       subcategory: 'Cold',      image: '💧', available: true,  stockQuantity: 100, barcode: '8901234560008' },
  { id: 9,  name: 'Red Bull 250ml',     price: 150, category: 'drinks',        categoryId: 'drinks',       subcategory: 'Energy',    image: '⚡', available: true,  stockQuantity: 24, barcode: '9002490100070' },
  { id: 10, name: 'Nescafe Sachet',     price: 25,  category: 'drinks',        categoryId: 'drinks',       subcategory: 'Hot',       image: '☕', available: true,  stockQuantity: 80, barcode: '8901234560010' },
  { id: 11, name: 'Lipton Tea Bag',     price: 10,  category: 'drinks',        categoryId: 'drinks',       subcategory: 'Hot',       image: '🍵', available: true,  stockQuantity: 100, barcode: '8901234560011' },
  { id: 12, name: 'Oreo Original',      price: 50,  category: 'biscuits',      categoryId: 'biscuits',     subcategory: 'Cream',     image: '🍪', available: true,  stockQuantity: 40, barcode: '7622210713780' },
  { id: 13, name: 'Hide & Seek',        price: 30,  category: 'biscuits',      categoryId: 'biscuits',     subcategory: 'Cream',     image: '🍪', available: true,  stockQuantity: 35, barcode: '8901234560013' },
  { id: 14, name: 'Marie Gold',         price: 25,  category: 'biscuits',      categoryId: 'biscuits',     subcategory: 'Plain',     image: '🫓', available: true,  stockQuantity: 50, barcode: '8901234560014' },
  { id: 15, name: 'Ball Pen Blue',      price: 10,  category: 'stationery',    categoryId: 'stationery',   subcategory: 'Pens',      image: '✏️', available: true,  stockQuantity: 100, barcode: '8901234560015' },
  { id: 16, name: 'Ball Pen Black',     price: 10,  category: 'stationery',    categoryId: 'stationery',   subcategory: 'Pens',      image: '🖊️', available: true,  stockQuantity: 100, barcode: '8901234560016' },
  { id: 17, name: 'Eraser White',       price: 5,   category: 'stationery',    categoryId: 'stationery',   subcategory: 'Erasers',   image: '🧹', available: true,  stockQuantity: 80, barcode: '8901234560017' },
  { id: 18, name: 'A4 Notebook',        price: 80,  category: 'stationery',    categoryId: 'stationery',   subcategory: 'Notebooks', image: '📓', available: true,  stockQuantity: 25, barcode: '8901234560018' },
  { id: 19, name: 'Milk Pouch 500ml',   price: 55,  category: 'dairy',         categoryId: 'dairy',        subcategory: 'Milk',      image: '🥛', available: true,  stockQuantity: 20, barcode: '8901234560019' },
  { id: 20, name: 'Yogurt Cup',         price: 45,  category: 'dairy',         categoryId: 'dairy',        subcategory: 'Yogurt',    image: '🍦', available: true,  stockQuantity: 15, barcode: '8901234560020' },
  { id: 21, name: 'Kit Kat',            price: 50,  category: 'confectionery', categoryId: 'confectionery',subcategory: 'Chocolate', image: '🍫', available: true,  stockQuantity: 40, barcode: '5000159484695' },
  { id: 22, name: 'Dairy Milk',         price: 60,  category: 'confectionery', categoryId: 'confectionery',subcategory: 'Chocolate', image: '🍫', available: true,  stockQuantity: 35, barcode: '7622210313231' },
  { id: 23, name: 'Mint Gum',           price: 20,  category: 'confectionery', categoryId: 'confectionery',subcategory: 'Gum',       image: '🍬', available: true,  stockQuantity: 60, barcode: '8901234560023' },
  { id: 24, name: 'Mixed Candy Bag',    price: 30,  category: 'confectionery', categoryId: 'confectionery',subcategory: 'Candy',     image: '🍭', available: true,  stockQuantity: 45, barcode: '8901234560024' },
];

export const products = initialProducts;

export const initialStaff: StaffMember[] = [
  { id: 1, name: 'Admin User',  email: 'admin@tuckshop.com',  role: 'admin',    phone: '+92 300 1234567', shift: 'Morning', status: 'active' },
  { id: 2, name: 'Ali Cashier', email: 'cashier@tuckshop.com',role: 'cashier',  phone: '+92 301 7654321', shift: 'Morning', status: 'active' },
];

export const initialOrders: OrderRecord[] = [
  {
    id: 1001,
    orderNumber: 'TK-1001',
    status: 'Completed',
    total: 110,
    itemsCount: 3,
    createdAt: new Date(Date.now() - 30 * 60000).toISOString(),
    paymentMethod: 'Cash',
    items: [
      { productName: 'Lays Classic',   quantity: 2, price: 30 },
      { productName: 'Coca Cola 500ml',quantity: 1, price: 60 },
      { productName: 'Mint Gum',       quantity: 1, price: 20 },
    ],
  },
  {
    id: 1002,
    orderNumber: 'TK-1002',
    status: 'Completed',
    total: 200,
    itemsCount: 2,
    createdAt: new Date(Date.now() - 60 * 60000).toISOString(),
    paymentMethod: 'Digital',
    items: [
      { productName: 'Oreo Original',  quantity: 2, price: 50 },
      { productName: 'Red Bull 250ml', quantity: 1, price: 150 },
    ],
  },
];

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
  phone: '+92 300 0000000',
  email: 'admin@tuckshop.com',
  address: 'School Campus, Block A',
  currency: 'PKR',
  currencySymbol: 'Rs',
  taxRate: getStoredTaxRate(),
  lowStockThreshold: 5,
  receiptFooter: 'Thank you for your purchase!',
};

export const dashboardStats = {
  todayRevenue: 4850,
  weeklyRevenue: 32400,
  monthlyRevenue: 128500,
  totalOrders: 156,
  todayOrderCount: 42,
  avgOrderValue: 82,
  lowStockCount: 3,
  outOfStockCount: 0,
  topItems: [
    { name: 'Coca Cola 500ml', quantity: 65, revenue: 3900 },
    { name: 'Lays Classic',    quantity: 58, revenue: 1740 },
    { name: 'Oreo Original',   quantity: 42, revenue: 2100 },
    { name: 'Kit Kat',         quantity: 38, revenue: 1900 },
    { name: 'Mineral Water',   quantity: 72, revenue: 2160 },
  ],
  salesTrend: [
    { day: 'Mon', sales: 4200 },
    { day: 'Tue', sales: 3800 },
    { day: 'Wed', sales: 5100 },
    { day: 'Thu', sales: 4700 },
    { day: 'Fri', sales: 6200 },
    { day: 'Sat', sales: 7100 },
    { day: 'Sun', sales: 5500 },
  ],
  categoryPerformance: [
    { name: 'Drinks',     value: 35 },
    { name: 'Snacks',     value: 28 },
    { name: 'Sweets',     value: 18 },
    { name: 'Biscuits',   value: 12 },
    { name: 'Stationery', value: 7  },
  ],
  paymentBreakdown: [
    { method: 'Cash',    count: 95, total: 78000 },
    { method: 'Digital', count: 61, total: 50500 },
  ],
};
