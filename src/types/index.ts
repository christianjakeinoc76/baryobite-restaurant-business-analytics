export interface User {
  id: number;
  name: string;
  email: string;
  role: 'Admin' | 'Manager' | 'Staff';
  createdAt: string;
}

export type OrderType = 'Dine-In' | 'Takeout' | 'Delivery';
export type OrderStatus = 'Completed' | 'Preparing' | 'Pending' | 'Cancelled';

export interface OrderItem {
  menuItemId: number;
  name: string;
  quantity: number;
  unitPrice: number;
  unitCost: number;
}

export interface Order {
  id: number;
  orderCode: string;
  date: string; // YYYY-MM-DD
  createdAt: string;
  customerId: number;
  customerName: string;
  orderType: OrderType;
  status: OrderStatus;
  items: OrderItem[];
  totalAmount: number;
  totalCost: number;
}

export type ReservationStatus = 'Confirmed' | 'Seated' | 'Completed' | 'Cancelled';

export interface Reservation {
  id: number;
  reservationCode: string;
  customerName: string;
  phone: string;
  email: string;
  partySize: number;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  tableNumber: string;
  status: ReservationStatus;
  notes: string;
}

export type MenuCategory = 'Main Course' | 'Appetizer' | 'Dessert' | 'Beverage';

export interface MenuItem {
  id: number;
  name: string;
  category: MenuCategory;
  price: number;
  cost: number;
  available: boolean;
  description: string;
  soldCount: number;
}

export interface InventoryItem {
  id: number;
  name: string;
  category: 'Meat & Poultry' | 'Seafood' | 'Produce' | 'Dry Goods' | 'Beverages' | 'Dairy & Condiments';
  quantity: number;
  unit: string;
  reorderLevel: number;
  unitCost: number;
  supplier: string;
  lastUpdated: string;
}

export interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  loyaltyTier: 'Bronze' | 'Silver' | 'Gold' | 'VIP';
  joinedDate: string;
}

export interface Expense {
  id: number;
  date: string; // YYYY-MM-DD
  category: 'Ingredients' | 'Utilities' | 'Payroll' | 'Rent' | 'Marketing' | 'Equipment';
  description: string;
  amount: number;
}

export interface RestaurantSettings {
  restaurantName: string;
  tagline: string;
  address: string;
  phone: string;
  email: string;
  taxRate: number;
  currency: string;
}

export interface PrescriptiveInsight {
  id: string;
  category: 'Inventory' | 'Menu Margin' | 'Operations' | 'Customer Retention';
  priority: 'High' | 'Medium' | 'Low';
  title: string;
  finding: string;
  recommendedAction: string;
  expectedImpact: string;
}
