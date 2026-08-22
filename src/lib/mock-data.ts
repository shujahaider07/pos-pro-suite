export type TableStatus = 'available' | 'occupied' | 'reserved';

export interface TableData {
  id: number;
  name: string;
  status: TableStatus;
  capacity: number;
  orderTotal?: number;
  elapsedMinutes?: number;
  orderId?: string;
}

export interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  categoryId?: string;
  subcategory?: string;
  image: string;
  available: boolean;
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
  tableId: number;
  tableName: string;
  status: 'Completed' | 'Active' | 'Held' | 'Cancelled';
  total: number;
  itemsCount: number;
  createdAt: string;
  paymentMethod: 'cash' | 'card' | 'upi';
  serverName: string;
  items: { productName: string; quantity: number; price: number }[];
}

export interface RestaurantSettings {
  restaurantName: string;
  tagline: string;
  phone: string;
  email: string;
  address: string;
  currency: string;
  currencySymbol: string;
  taxRate: number;
  serviceChargeRate: number;
  kotAutoPrint: boolean;
}

export const initialTables: TableData[] = [
  { id: 1, name: 'T1', status: 'available', capacity: 4 },
  { id: 2, name: 'T2', status: 'occupied', capacity: 4, orderTotal: 1250, elapsedMinutes: 32, orderId: 'ORD-2041' },
  { id: 3, name: 'T3', status: 'occupied', capacity: 6, orderTotal: 890, elapsedMinutes: 15, orderId: 'ORD-2042' },
  { id: 4, name: 'T4', status: 'available', capacity: 2 },
  { id: 5, name: 'T5', status: 'reserved', capacity: 4 },
  { id: 6, name: 'T6', status: 'available', capacity: 6 },
  { id: 7, name: 'T7', status: 'occupied', capacity: 4, orderTotal: 2100, elapsedMinutes: 48, orderId: 'ORD-2039' },
  { id: 8, name: 'T8', status: 'available', capacity: 2 },
  { id: 9, name: 'T9', status: 'reserved', capacity: 8 },
  { id: 10, name: 'T10', status: 'available', capacity: 4 },
];

export const tables = initialTables;

export const initialCategories: Category[] = [
  { id: 'all', name: 'All Items', icon: '🍽️' },
  { id: 'starters', name: 'Starters', icon: '🥗', subcategories: ['Soups', 'Salads', 'Appetizers'] },
  { id: 'mains', name: 'Main Course', icon: '🍖', subcategories: ['Chicken', 'Seafood', 'Vegetarian'] },
  { id: 'pizza', name: 'Pizza', icon: '🍕', subcategories: ['Classic', 'Premium'] },
  { id: 'burgers', name: 'Burgers', icon: '🍔', subcategories: ['Beef', 'Chicken', 'Veggie'] },
  { id: 'beverages', name: 'Beverages', icon: '🥤', subcategories: ['Hot', 'Cold', 'Juices'] },
  { id: 'desserts', name: 'Desserts', icon: '🍰', subcategories: ['Cakes', 'Ice Cream'] },
];

export const categories = initialCategories;

export const initialProducts: Product[] = [
  { id: 1, name: 'Caesar Salad', price: 320, category: 'starters', categoryId: 'starters', subcategory: 'Salads', image: '🥗', available: true },
  { id: 2, name: 'Tomato Soup', price: 220, category: 'starters', categoryId: 'starters', subcategory: 'Soups', image: '🍲', available: true },
  { id: 3, name: 'Spring Rolls', price: 280, category: 'starters', categoryId: 'starters', subcategory: 'Appetizers', image: '🥟', available: true },
  { id: 4, name: 'Grilled Chicken', price: 550, category: 'mains', categoryId: 'mains', subcategory: 'Chicken', image: '🍗', available: true },
  { id: 5, name: 'Butter Chicken', price: 480, category: 'mains', categoryId: 'mains', subcategory: 'Chicken', image: '🍛', available: true },
  { id: 6, name: 'Fish & Chips', price: 520, category: 'mains', categoryId: 'mains', subcategory: 'Seafood', image: '🐟', available: true },
  { id: 7, name: 'Paneer Tikka', price: 380, category: 'mains', categoryId: 'mains', subcategory: 'Vegetarian', image: '🧀', available: true },
  { id: 8, name: 'Margherita Pizza', price: 420, category: 'pizza', categoryId: 'pizza', subcategory: 'Classic', image: '🍕', available: true },
  { id: 9, name: 'Pepperoni Pizza', price: 520, category: 'pizza', categoryId: 'pizza', subcategory: 'Classic', image: '🍕', available: true },
  { id: 10, name: 'BBQ Chicken Pizza', price: 580, category: 'pizza', categoryId: 'pizza', subcategory: 'Premium', image: '🍕', available: false },
  { id: 11, name: 'Classic Burger', price: 350, category: 'burgers', categoryId: 'burgers', subcategory: 'Beef', image: '🍔', available: true },
  { id: 12, name: 'Cheese Burger', price: 400, category: 'burgers', categoryId: 'burgers', subcategory: 'Beef', image: '🍔', available: true },
  { id: 13, name: 'Chicken Burger', price: 380, category: 'burgers', categoryId: 'burgers', subcategory: 'Chicken', image: '🍔', available: true },
  { id: 14, name: 'Espresso', price: 150, category: 'beverages', categoryId: 'beverages', subcategory: 'Hot', image: '☕', available: true },
  { id: 15, name: 'Iced Latte', price: 200, category: 'beverages', categoryId: 'beverages', subcategory: 'Cold', image: '🧊', available: true },
  { id: 16, name: 'Fresh Orange Juice', price: 180, category: 'beverages', categoryId: 'beverages', subcategory: 'Juices', image: '🍊', available: true },
  { id: 17, name: 'Chocolate Cake', price: 280, category: 'desserts', categoryId: 'desserts', subcategory: 'Cakes', image: '🍫', available: true },
  { id: 18, name: 'Vanilla Ice Cream', price: 180, category: 'desserts', categoryId: 'desserts', subcategory: 'Ice Cream', image: '🍨', available: true },
];

export const products = initialProducts;

export const initialStaff: StaffMember[] = [
  { id: 1, name: 'Admin User', email: 'admin@resto.com', role: 'admin', phone: '+92 300 1234567', shift: 'Morning', status: 'active' },
  { id: 2, name: 'John Smith', email: 'john@resto.com', role: 'employee', phone: '+92 301 7654321', shift: 'Evening', status: 'active' },
  { id: 3, name: 'Sarah Connor', email: 'sarah@resto.com', role: 'cashier', phone: '+92 302 9876543', shift: 'Morning', status: 'active' },
  { id: 4, name: 'Alex Johnson', email: 'alex@resto.com', role: 'manager', phone: '+92 303 5432167', shift: 'Night', status: 'active' },
];

export const initialOrders: OrderRecord[] = [
  {
    id: 2041,
    orderNumber: 'ORD-2041',
    tableId: 2,
    tableName: 'T2',
    status: 'Active',
    total: 1250,
    itemsCount: 3,
    createdAt: new Date(Date.now() - 32 * 60000).toISOString(),
    paymentMethod: 'card',
    serverName: 'John',
    items: [
      { productName: 'Butter Chicken', quantity: 2, price: 480 },
      { productName: 'Spring Rolls', quantity: 1, price: 280 },
    ],
  },
  {
    id: 2042,
    orderNumber: 'ORD-2042',
    tableId: 3,
    tableName: 'T3',
    status: 'Active',
    total: 890,
    itemsCount: 2,
    createdAt: new Date(Date.now() - 15 * 60000).toISOString(),
    paymentMethod: 'upi',
    serverName: 'Staff',
    items: [
      { productName: 'Margherita Pizza', quantity: 1, price: 420 },
      { productName: 'Grilled Chicken', quantity: 1, price: 470 },
    ],
  },
  {
    id: 2040,
    orderNumber: 'ORD-2040',
    tableId: 1,
    tableName: 'T1',
    status: 'Completed',
    total: 1640,
    itemsCount: 4,
    createdAt: new Date(Date.now() - 90 * 60000).toISOString(),
    paymentMethod: 'cash',
    serverName: 'Admin',
    items: [
      { productName: 'Pepperoni Pizza', quantity: 2, price: 520 },
      { productName: 'Caesar Salad', quantity: 1, price: 320 },
      { productName: 'Spring Rolls', quantity: 1, price: 280 },
    ],
  },
  {
    id: 2039,
    orderNumber: 'ORD-2039',
    tableId: 7,
    tableName: 'T7',
    status: 'Active',
    total: 2100,
    itemsCount: 5,
    createdAt: new Date(Date.now() - 48 * 60000).toISOString(),
    paymentMethod: 'card',
    serverName: 'John',
    items: [
      { productName: 'Grilled Chicken', quantity: 2, price: 550 },
      { productName: 'Butter Chicken', quantity: 1, price: 480 },
      { productName: 'Chocolate Cake', quantity: 1, price: 280 },
      { productName: 'Iced Latte', quantity: 1, price: 200 },
    ],
  },
  {
    id: 2038,
    orderNumber: 'ORD-2038',
    tableId: 5,
    tableName: 'T5',
    status: 'Completed',
    total: 3150,
    itemsCount: 6,
    createdAt: new Date(Date.now() - 180 * 60000).toISOString(),
    paymentMethod: 'card',
    serverName: 'Sarah',
    items: [
      { productName: 'Fish & Chips', quantity: 3, price: 520 },
      { productName: 'Margherita Pizza', quantity: 2, price: 420 },
      { productName: 'Espresso', quantity: 5, price: 150 },
    ],
  },
];

export const initialSettings: RestaurantSettings = {
  restaurantName: 'RestoPOS Gourmet',
  tagline: 'Premium Dining & Fast Casual Management',
  phone: '+92 300 1234567',
  email: 'contact@restopos.com',
  address: 'Main Boulevard, Gulberg III, Lahore',
  currency: 'PKR',
  currencySymbol: 'Rs',
  taxRate: 5,
  serviceChargeRate: 2,
  kotAutoPrint: true,
};

export const dashboardStats = {
  todayRevenue: 48750,
  weeklyRevenue: 324500,
  monthlyRevenue: 1285000,
  totalOrders: 156,
  avgOrderValue: 312,
  topItems: [
    { name: 'Butter Chicken', quantity: 42, revenue: 20160 },
    { name: 'Margherita Pizza', quantity: 38, revenue: 15960 },
    { name: 'Caesar Salad', quantity: 35, revenue: 11200 },
    { name: 'Classic Burger', quantity: 30, revenue: 10500 },
    { name: 'Espresso', quantity: 65, revenue: 9750 },
  ],
  salesTrend: [
    { day: 'Mon', sales: 42000 },
    { day: 'Tue', sales: 38000 },
    { day: 'Wed', sales: 51000 },
    { day: 'Thu', sales: 47000 },
    { day: 'Fri', sales: 62000 },
    { day: 'Sat', sales: 71000 },
    { day: 'Sun', sales: 55000 },
  ],
  categoryPerformance: [
    { name: 'Main Course', value: 35 },
    { name: 'Pizza', value: 25 },
    { name: 'Burgers', value: 18 },
    { name: 'Beverages', value: 12 },
    { name: 'Desserts', value: 10 },
  ],
};
