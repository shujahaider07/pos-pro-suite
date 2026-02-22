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

export const tables: TableData[] = [
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

export const categories: Category[] = [
  { id: 'all', name: 'All Items', icon: '🍽️' },
  { id: 'starters', name: 'Starters', icon: '🥗', subcategories: ['Soups', 'Salads', 'Appetizers'] },
  { id: 'mains', name: 'Main Course', icon: '🍖', subcategories: ['Chicken', 'Seafood', 'Vegetarian'] },
  { id: 'pizza', name: 'Pizza', icon: '🍕', subcategories: ['Classic', 'Premium'] },
  { id: 'burgers', name: 'Burgers', icon: '🍔', subcategories: ['Beef', 'Chicken', 'Veggie'] },
  { id: 'beverages', name: 'Beverages', icon: '🥤', subcategories: ['Hot', 'Cold', 'Juices'] },
  { id: 'desserts', name: 'Desserts', icon: '🍰', subcategories: ['Cakes', 'Ice Cream'] },
];

export const products: Product[] = [
  { id: 1, name: 'Caesar Salad', price: 320, category: 'starters', subcategory: 'Salads', image: '🥗', available: true },
  { id: 2, name: 'Tomato Soup', price: 220, category: 'starters', subcategory: 'Soups', image: '🍲', available: true },
  { id: 3, name: 'Spring Rolls', price: 280, category: 'starters', subcategory: 'Appetizers', image: '🥟', available: true },
  { id: 4, name: 'Grilled Chicken', price: 550, category: 'mains', subcategory: 'Chicken', image: '🍗', available: true },
  { id: 5, name: 'Butter Chicken', price: 480, category: 'mains', subcategory: 'Chicken', image: '🍛', available: true },
  { id: 6, name: 'Fish & Chips', price: 520, category: 'mains', subcategory: 'Seafood', image: '🐟', available: true },
  { id: 7, name: 'Paneer Tikka', price: 380, category: 'mains', subcategory: 'Vegetarian', image: '🧀', available: true },
  { id: 8, name: 'Margherita Pizza', price: 420, category: 'pizza', subcategory: 'Classic', image: '🍕', available: true },
  { id: 9, name: 'Pepperoni Pizza', price: 520, category: 'pizza', subcategory: 'Classic', image: '🍕', available: true },
  { id: 10, name: 'BBQ Chicken Pizza', price: 580, category: 'pizza', subcategory: 'Premium', image: '🍕', available: false },
  { id: 11, name: 'Classic Burger', price: 350, category: 'burgers', subcategory: 'Beef', image: '🍔', available: true },
  { id: 12, name: 'Cheese Burger', price: 400, category: 'burgers', subcategory: 'Beef', image: '🍔', available: true },
  { id: 13, name: 'Chicken Burger', price: 380, category: 'burgers', subcategory: 'Chicken', image: '🍔', available: true },
  { id: 14, name: 'Espresso', price: 150, category: 'beverages', subcategory: 'Hot', image: '☕', available: true },
  { id: 15, name: 'Iced Latte', price: 200, category: 'beverages', subcategory: 'Cold', image: '🧊', available: true },
  { id: 16, name: 'Fresh Orange Juice', price: 180, category: 'beverages', subcategory: 'Juices', image: '🍊', available: true },
  { id: 17, name: 'Chocolate Cake', price: 280, category: 'desserts', subcategory: 'Cakes', image: '🍫', available: true },
  { id: 18, name: 'Vanilla Ice Cream', price: 180, category: 'desserts', subcategory: 'Ice Cream', image: '🍨', available: true },
];

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
