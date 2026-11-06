import 'dotenv/config';
import express, { type Request, type Response, type NextFunction } from 'express';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { createServer as createViteServer } from 'vite';
import {
  computeDashboardStats,
  computeMonthlySalesSeries,
  computePredictiveForecast,
  computePrescriptiveInsights,
  computeWeeklySalesSummary,
} from './src/utils/analytics';
import type {
  Customer,
  Expense,
  InventoryItem,
  MenuItem,
  Order,
  Reservation,
  RestaurantSettings,
  User,
} from './src/types';

interface StoredUser extends User {
  passwordHash: string;
}

interface SessionRecord {
  token: string;
  userId: number;
  expiresAt: number;
}

interface PasswordResetRecord {
  email: string;
  token: string;
  expiresAt: number;
}

interface DatabaseSchema {
  users: StoredUser[];
  sessions: SessionRecord[];
  passwordResets: PasswordResetRecord[];
  orders: Order[];
  reservations: Reservation[];
  menu: MenuItem[];
  inventory: InventoryItem[];
  customers: Customer[];
  expenses: Expense[];
  settings: RestaurantSettings;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'baryobite-db.json');

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, keyHex] = storedHash.split(':');
  if (!salt || !keyHex) return false;
  const keyBuf = Buffer.from(keyHex, 'hex');
  const derivedBuf = crypto.scryptSync(password, salt, 64);
  if (keyBuf.length !== derivedBuf.length) return false;
  return crypto.timingSafeEqual(keyBuf, derivedBuf);
}

function createInitialDatabase(): DatabaseSchema {
  const adminPasswordHash = hashPassword('password123');

  const menu: MenuItem[] = [
    {
      id: 1,
      name: 'Baryo Chicken Inasal',
      category: 'Main Course',
      price: 265,
      cost: 105,
      available: true,
      description: 'Charcoal-grilled quarter chicken marinated in lemongrass, calamansi, and annatto oil.',
      soldCount: 184,
    },
    {
      id: 2,
      name: 'Sizzling Pork Sisig Platter',
      category: 'Main Course',
      price: 340,
      cost: 145,
      available: true,
      description: 'Crispy chopped pork face and belly tossed with calamansi, chili, and red onions.',
      soldCount: 162,
    },
    {
      id: 3,
      name: 'Beef Kare-Kare',
      category: 'Main Course',
      price: 480,
      cost: 220,
      available: true,
      description: 'Slow-braised beef shank and tripe in rich roasted peanut sauce with house bagoong.',
      soldCount: 98,
    },
    {
      id: 4,
      name: 'Sinigang na Baboy',
      category: 'Main Course',
      price: 390,
      cost: 165,
      available: true,
      description: 'Savory tamarind broth with tender pork ribs, kangkong, radish, and sitaw.',
      soldCount: 145,
    },
    {
      id: 5,
      name: 'Crispy Pata (Family)',
      category: 'Main Course',
      price: 790,
      cost: 390,
      available: true,
      description: 'Deep-fried whole pork hock served with spiced soy-vinegar dipping sauce.',
      soldCount: 64,
    },
    {
      id: 6,
      name: 'Lumpiang Shanghai (12 pcs)',
      category: 'Appetizer',
      price: 210,
      cost: 78,
      available: true,
      description: 'Golden-fried minced pork and vegetable spring rolls with sweet chili sauce.',
      soldCount: 190,
    },
    {
      id: 7,
      name: 'Tokwa’t Baboy',
      category: 'Appetizer',
      price: 195,
      cost: 75,
      available: true,
      description: 'Crispy fried tofu and pork ear cubes in tangy soy-vinegar dressing.',
      soldCount: 82,
    },
    {
      id: 8,
      name: 'Ensaladang Talong',
      category: 'Appetizer',
      price: 165,
      cost: 55,
      available: true,
      description: 'Smoky grilled eggplant salad with tomatoes, salted egg, and shallots.',
      soldCount: 41,
    },
    {
      id: 9,
      name: 'Baryo Special Halo-Halo',
      category: 'Dessert',
      price: 175,
      cost: 62,
      available: true,
      description: 'Shaved ice layered with sweet beans, macapuno, leche flan, and ube ice cream.',
      soldCount: 156,
    },
    {
      id: 10,
      name: 'Leche Flan',
      category: 'Dessert',
      price: 140,
      cost: 45,
      available: true,
      description: 'Silky caramel custard made with farm-fresh egg yolks and condensed milk.',
      soldCount: 112,
    },
    {
      id: 11,
      name: 'Fresh Calamansi Juice Pitcher',
      category: 'Beverage',
      price: 160,
      cost: 35,
      available: true,
      description: 'Freshly squeezed Philippine lime juice lightly sweetened with wildflower honey.',
      soldCount: 210,
    },
    {
      id: 12,
      name: 'Sago’t Gulaman',
      category: 'Beverage',
      price: 95,
      cost: 22,
      available: true,
      description: 'Chilled brown sugar arnibal drink with chewy tapioca pearls and agar jelly.',
      soldCount: 178,
    },
  ];

  const customers: Customer[] = [
    { id: 1, name: 'Maria Clara Santos', email: 'maria.santos@example.com', phone: '0917-555-0101', loyaltyTier: 'VIP', joinedDate: '2026-01-12' },
    { id: 2, name: 'Juan Miguel Dela Cruz', email: 'juan.delacruz@example.com', phone: '0918-555-0102', loyaltyTier: 'Gold', joinedDate: '2026-02-04' },
    { id: 3, name: 'Angela Reyes', email: 'angela.reyes@example.com', phone: '0919-555-0103', loyaltyTier: 'Gold', joinedDate: '2026-02-19' },
    { id: 4, name: 'Carlo Mendoza', email: 'carlo.mendoza@example.com', phone: '0920-555-0104', loyaltyTier: 'Silver', joinedDate: '2026-03-22' },
    { id: 5, name: 'Bea Alonzo-Tan', email: 'bea.tan@example.com', phone: '0921-555-0105', loyaltyTier: 'VIP', joinedDate: '2026-04-08' },
    { id: 6, name: 'Rafael Bautista', email: 'rafael.bautista@example.com', phone: '0922-555-0106', loyaltyTier: 'Silver', joinedDate: '2026-05-14' },
    { id: 7, name: 'Camille Navarro', email: 'camille.navarro@example.com', phone: '0923-555-0107', loyaltyTier: 'Bronze', joinedDate: '2026-07-01' },
    { id: 8, name: 'Marco Villanueva', email: 'marco.v@example.com', phone: '0924-555-0108', loyaltyTier: 'Bronze', joinedDate: '2026-08-19' },
  ];

  const inventory: InventoryItem[] = [
    { id: 1, name: 'Whole Chicken (Dressed)', category: 'Meat & Poultry', quantity: 8, unit: 'kg', reorderLevel: 15, unitCost: 185, supplier: 'Baryo Poultry Farms', lastUpdated: '2026-11-05' },
    { id: 2, name: 'Pork Belly & Maskara', category: 'Meat & Poultry', quantity: 24, unit: 'kg', reorderLevel: 12, unitCost: 290, supplier: 'Batangas Meat Co.', lastUpdated: '2026-11-05' },
    { id: 3, name: 'Beef Shank (Bulalo Cut)', category: 'Meat & Poultry', quantity: 14, unit: 'kg', reorderLevel: 8, unitCost: 420, supplier: 'Batangas Meat Co.', lastUpdated: '2026-11-04' },
    { id: 4, name: 'Fresh Calamansi', category: 'Produce', quantity: 4, unit: 'kg', reorderLevel: 10, unitCost: 95, supplier: 'Tagaytay Fresh Produce', lastUpdated: '2026-11-05' },
    { id: 5, name: 'Kangkong & Sitaw Bundle', category: 'Produce', quantity: 18, unit: 'bundles', reorderLevel: 10, unitCost: 45, supplier: 'Tagaytay Fresh Produce', lastUpdated: '2026-11-05' },
    { id: 6, name: 'Jasmine Rice (25kg Sack)', category: 'Dry Goods', quantity: 16, unit: 'sacks', reorderLevel: 6, unitCost: 1250, supplier: 'Nueva Ecija Grains', lastUpdated: '2026-11-03' },
    { id: 7, name: 'Roasted Peanut Paste', category: 'Dry Goods', quantity: 3, unit: 'jars', reorderLevel: 8, unitCost: 240, supplier: 'Manila Pantry Supply', lastUpdated: '2026-11-04' },
    { id: 8, name: 'Ube Ice Cream (Gallon)', category: 'Dairy & Condiments', quantity: 9, unit: 'tubs', reorderLevel: 4, unitCost: 480, supplier: 'Creamery Artisans', lastUpdated: '2026-11-05' },
    { id: 9, name: 'Soy Sauce & Cane Vinegar', category: 'Dairy & Condiments', quantity: 22, unit: 'liters', reorderLevel: 8, unitCost: 85, supplier: 'Manila Pantry Supply', lastUpdated: '2026-11-02' },
    { id: 10, name: 'Tapioca Pearls (Sago)', category: 'Beverages', quantity: 12, unit: 'kg', reorderLevel: 5, unitCost: 110, supplier: 'Manila Pantry Supply', lastUpdated: '2026-11-04' },
  ];

  const orders: Order[] = [
    // June 2026
    {
      id: 1,
      orderCode: 'ORD-1025',
      date: '2026-06-12',
      createdAt: '2026-06-12T12:30:00Z',
      customerId: 1,
      customerName: 'Maria Clara Santos',
      orderType: 'Dine-In',
      status: 'Completed',
      items: [
        { menuItemId: 1, name: 'Baryo Chicken Inasal', quantity: 4, unitPrice: 265, unitCost: 105 },
        { menuItemId: 11, name: 'Fresh Calamansi Juice Pitcher', quantity: 2, unitPrice: 160, unitCost: 35 },
      ],
      totalAmount: 1380,
      totalCost: 490,
    },
    {
      id: 2,
      orderCode: 'ORD-1026',
      date: '2026-06-24',
      createdAt: '2026-06-24T19:15:00Z',
      customerId: 2,
      customerName: 'Juan Miguel Dela Cruz',
      orderType: 'Delivery',
      status: 'Completed',
      items: [
        { menuItemId: 5, name: 'Crispy Pata (Family)', quantity: 2, unitPrice: 790, unitCost: 390 },
        { menuItemId: 6, name: 'Lumpiang Shanghai (12 pcs)', quantity: 2, unitPrice: 210, unitCost: 78 },
      ],
      totalAmount: 2000,
      totalCost: 936,
    },
    // July 2026
    {
      id: 3,
      orderCode: 'ORD-1027',
      date: '2026-07-08',
      createdAt: '2026-07-08T13:10:00Z',
      customerId: 3,
      customerName: 'Angela Reyes',
      orderType: 'Dine-In',
      status: 'Completed',
      items: [
        { menuItemId: 3, name: 'Beef Kare-Kare', quantity: 3, unitPrice: 480, unitCost: 220 },
        { menuItemId: 9, name: 'Baryo Special Halo-Halo', quantity: 4, unitPrice: 175, unitCost: 62 },
      ],
      totalAmount: 2140,
      totalCost: 908,
    },
    {
      id: 4,
      orderCode: 'ORD-1028',
      date: '2026-07-21',
      createdAt: '2026-07-21T18:45:00Z',
      customerId: 4,
      customerName: 'Carlo Mendoza',
      orderType: 'Takeout',
      status: 'Completed',
      items: [
        { menuItemId: 2, name: 'Sizzling Pork Sisig Platter', quantity: 4, unitPrice: 340, unitCost: 145 },
        { menuItemId: 12, name: 'Sago’t Gulaman', quantity: 4, unitPrice: 95, unitCost: 22 },
      ],
      totalAmount: 1740,
      totalCost: 668,
    },
    // August 2026
    {
      id: 5,
      orderCode: 'ORD-1029',
      date: '2026-08-09',
      createdAt: '2026-08-09T12:50:00Z',
      customerId: 5,
      customerName: 'Bea Alonzo-Tan',
      orderType: 'Dine-In',
      status: 'Completed',
      items: [
        { menuItemId: 4, name: 'Sinigang na Baboy', quantity: 4, unitPrice: 390, unitCost: 165 },
        { menuItemId: 5, name: 'Crispy Pata (Family)', quantity: 2, unitPrice: 790, unitCost: 390 },
      ],
      totalAmount: 3140,
      totalCost: 1440,
    },
    {
      id: 6,
      orderCode: 'ORD-1030',
      date: '2026-08-22',
      createdAt: '2026-08-22T20:05:00Z',
      customerId: 6,
      customerName: 'Rafael Bautista',
      orderType: 'Delivery',
      status: 'Completed',
      items: [
        { menuItemId: 1, name: 'Baryo Chicken Inasal', quantity: 5, unitPrice: 265, unitCost: 105 },
        { menuItemId: 10, name: 'Leche Flan', quantity: 3, unitPrice: 140, unitCost: 45 },
      ],
      totalAmount: 1745,
      totalCost: 660,
    },
    // September 2026
    {
      id: 7,
      orderCode: 'ORD-1031',
      date: '2026-09-11',
      createdAt: '2026-09-11T13:20:00Z',
      customerId: 1,
      customerName: 'Maria Clara Santos',
      orderType: 'Dine-In',
      status: 'Completed',
      items: [
        { menuItemId: 3, name: 'Beef Kare-Kare', quantity: 4, unitPrice: 480, unitCost: 220 },
        { menuItemId: 2, name: 'Sizzling Pork Sisig Platter', quantity: 3, unitPrice: 340, unitCost: 145 },
      ],
      totalAmount: 2940,
      totalCost: 1315,
    },
    {
      id: 8,
      orderCode: 'ORD-1032',
      date: '2026-09-25',
      createdAt: '2026-09-25T19:30:00Z',
      customerId: 7,
      customerName: 'Camille Navarro',
      orderType: 'Delivery',
      status: 'Completed',
      items: [
        { menuItemId: 5, name: 'Crispy Pata (Family)', quantity: 3, unitPrice: 790, unitCost: 390 },
        { menuItemId: 11, name: 'Fresh Calamansi Juice Pitcher', quantity: 2, unitPrice: 160, unitCost: 35 },
      ],
      totalAmount: 2690,
      totalCost: 1240,
    },
    // October 2026
    {
      id: 9,
      orderCode: 'ORD-1033',
      date: '2026-10-10',
      createdAt: '2026-10-10T12:40:00Z',
      customerId: 5,
      customerName: 'Bea Alonzo-Tan',
      orderType: 'Dine-In',
      status: 'Completed',
      items: [
        { menuItemId: 1, name: 'Baryo Chicken Inasal', quantity: 6, unitPrice: 265, unitCost: 105 },
        { menuItemId: 4, name: 'Sinigang na Baboy', quantity: 4, unitPrice: 390, unitCost: 165 },
        { menuItemId: 9, name: 'Baryo Special Halo-Halo', quantity: 5, unitPrice: 175, unitCost: 62 },
      ],
      totalAmount: 4025,
      totalCost: 1600,
    },
    {
      id: 10,
      orderCode: 'ORD-1034',
      date: '2026-10-24',
      createdAt: '2026-10-24T18:55:00Z',
      customerId: 2,
      customerName: 'Juan Miguel Dela Cruz',
      orderType: 'Takeout',
      status: 'Completed',
      items: [
        { menuItemId: 2, name: 'Sizzling Pork Sisig Platter', quantity: 5, unitPrice: 340, unitCost: 145 },
        { menuItemId: 6, name: 'Lumpiang Shanghai (12 pcs)', quantity: 4, unitPrice: 210, unitCost: 78 },
      ],
      totalAmount: 2540,
      totalCost: 1037,
    },
    // November 2026 (Current week)
    {
      id: 11,
      orderCode: 'ORD-1035',
      date: '2026-11-02',
      createdAt: '2026-11-02T12:15:00Z',
      customerId: 3,
      customerName: 'Angela Reyes',
      orderType: 'Dine-In',
      status: 'Completed',
      items: [
        { menuItemId: 1, name: 'Baryo Chicken Inasal', quantity: 4, unitPrice: 265, unitCost: 105 },
        { menuItemId: 11, name: 'Fresh Calamansi Juice Pitcher', quantity: 2, unitPrice: 160, unitCost: 35 },
      ],
      totalAmount: 1380,
      totalCost: 490,
    },
    {
      id: 12,
      orderCode: 'ORD-1036',
      date: '2026-11-03',
      createdAt: '2026-11-03T19:10:00Z',
      customerId: 8,
      customerName: 'Marco Villanueva',
      orderType: 'Delivery',
      status: 'Completed',
      items: [
        { menuItemId: 2, name: 'Sizzling Pork Sisig Platter', quantity: 3, unitPrice: 340, unitCost: 145 },
        { menuItemId: 6, name: 'Lumpiang Shanghai (12 pcs)', quantity: 2, unitPrice: 210, unitCost: 78 },
      ],
      totalAmount: 1440,
      totalCost: 591,
    },
    {
      id: 13,
      orderCode: 'ORD-1037',
      date: '2026-11-04',
      createdAt: '2026-11-04T13:05:00Z',
      customerId: 1,
      customerName: 'Maria Clara Santos',
      orderType: 'Dine-In',
      status: 'Completed',
      items: [
        { menuItemId: 3, name: 'Beef Kare-Kare', quantity: 3, unitPrice: 480, unitCost: 220 },
        { menuItemId: 9, name: 'Baryo Special Halo-Halo', quantity: 3, unitPrice: 175, unitCost: 62 },
      ],
      totalAmount: 1965,
      totalCost: 846,
    },
    {
      id: 14,
      orderCode: 'ORD-1038',
      date: '2026-11-05',
      createdAt: '2026-11-05T18:20:00Z',
      customerId: 5,
      customerName: 'Bea Alonzo-Tan',
      orderType: 'Dine-In',
      status: 'Preparing',
      items: [
        { menuItemId: 5, name: 'Crispy Pata (Family)', quantity: 2, unitPrice: 790, unitCost: 390 },
        { menuItemId: 4, name: 'Sinigang na Baboy', quantity: 2, unitPrice: 390, unitCost: 165 },
      ],
      totalAmount: 2360,
      totalCost: 1110,
    },
    {
      id: 15,
      orderCode: 'ORD-1039',
      date: '2026-11-06',
      createdAt: '2026-11-06T11:45:00Z',
      customerId: 4,
      customerName: 'Carlo Mendoza',
      orderType: 'Takeout',
      status: 'Pending',
      items: [
        { menuItemId: 1, name: 'Baryo Chicken Inasal', quantity: 3, unitPrice: 265, unitCost: 105 },
        { menuItemId: 12, name: 'Sago’t Gulaman', quantity: 3, unitPrice: 95, unitCost: 22 },
      ],
      totalAmount: 1080,
      totalCost: 381,
    },
  ];

  const expenses: Expense[] = [
    { id: 1, date: '2026-06-15', category: 'Ingredients', description: 'June Meat & Produce Restock', amount: 1450 },
    { id: 2, date: '2026-07-15', category: 'Ingredients', description: 'July Meat & Produce Restock', amount: 1620 },
    { id: 3, date: '2026-08-15', category: 'Utilities', description: 'August Electricity, Water & LPG', amount: 1890 },
    { id: 4, date: '2026-09-15', category: 'Ingredients', description: 'September Kitchen Supplies', amount: 2150 },
    { id: 5, date: '2026-10-15', category: 'Payroll', description: 'October Kitchen & Floor Staff', amount: 2480 },
    { id: 6, date: '2026-11-03', category: 'Ingredients', description: 'November Weekly Fresh Produce & Poultry', amount: 2650 },
  ];

  const reservations: Reservation[] = [
    {
      id: 1,
      reservationCode: 'RES-401',
      customerName: 'Maria Clara Santos',
      phone: '0917-555-0101',
      email: 'maria.santos@example.com',
      partySize: 6,
      date: '2026-11-06',
      time: '18:30',
      tableNumber: 'T-04',
      status: 'Confirmed',
      notes: 'Birthday dinner, prepare complimentary leche flan.',
    },
    {
      id: 2,
      reservationCode: 'RES-402',
      customerName: 'Bea Alonzo-Tan',
      phone: '0921-555-0105',
      email: 'bea.tan@example.com',
      partySize: 4,
      date: '2026-11-06',
      time: '19:00',
      tableNumber: 'T-02',
      status: 'Seated',
      notes: 'Window booth preferred.',
    },
    {
      id: 3,
      reservationCode: 'RES-403',
      customerName: 'Angela Reyes',
      phone: '0919-555-0103',
      email: 'angela.reyes@example.com',
      partySize: 8,
      date: '2026-11-07',
      time: '12:30',
      tableNumber: 'VIP-1',
      status: 'Confirmed',
      notes: 'Family lunch gathering.',
    },
    {
      id: 4,
      reservationCode: 'RES-404',
      customerName: 'Rafael Bautista',
      phone: '0922-555-0106',
      email: 'rafael.bautista@example.com',
      partySize: 2,
      date: '2026-11-05',
      time: '20:00',
      tableNumber: 'T-07',
      status: 'Completed',
      notes: '',
    },
  ];

  return {
    users: [
      {
        id: 1,
        name: 'Christian Jake Inoc',
        email: 'admin@baryobite.com',
        role: 'Admin',
        createdAt: '2026-01-01T08:00:00Z',
        passwordHash: adminPasswordHash,
      },
    ],
    sessions: [],
    passwordResets: [],
    orders,
    reservations,
    menu,
    inventory,
    customers,
    expenses,
    settings: {
      restaurantName: 'BaryoBite Kitchen & Grill',
      tagline: 'Authentic Filipino Comfort Food & Analytics',
      address: '148 Katipunan Ave, Quezon City, Metro Manila',
      phone: '(02) 8555-0192',
      email: 'hello@baryobite.com',
      taxRate: 12,
      currency: '₱',
    },
  };
}

function loadDatabase(): DatabaseSchema {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_PATH)) {
    const initial = createInitialDatabase();
    fs.writeFileSync(DB_PATH, JSON.stringify(initial, null, 2), 'utf-8');
    return initial;
  }
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(raw) as DatabaseSchema;
  } catch {
    const initial = createInitialDatabase();
    fs.writeFileSync(DB_PATH, JSON.stringify(initial, null, 2), 'utf-8');
    return initial;
  }
}

let db: DatabaseSchema = loadDatabase();

function saveDatabase() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
}

function sanitizeUser(u: StoredUser): User {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    createdAt: u.createdAt,
  };
}

function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }
  const cookieHeader = req.headers.cookie;
  if (cookieHeader) {
    const parts = cookieHeader.split(';').map((p) => p.trim());
    for (const part of parts) {
      if (part.startsWith('baryobite_token=')) {
        return decodeURIComponent(part.slice('baryobite_token='.length));
      }
    }
  }
  return null;
}

interface AuthenticatedRequest extends Request {
  currentUser?: StoredUser;
}

function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const token = extractToken(req);
  if (!token) {
    res.status(401).json({ message: 'Unauthenticated. Please log in.' });
    return;
  }
  const session = db.sessions.find((s) => s.token === token && s.expiresAt > Date.now());
  if (!session) {
    res.status(401).json({ message: 'Session expired or invalid. Please log in again.' });
    return;
  }
  const user = db.users.find((u) => u.id === session.userId);
  if (!user) {
    res.status(401).json({ message: 'User account not found.' });
    return;
  }
  req.currentUser = user;
  next();
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // --- AUTHENTICATION ROUTES ---
  app.post('/api/auth/login', (req: Request, res: Response) => {
    const { email, password, rememberMe } = req.body as {
      email?: string;
      password?: string;
      rememberMe?: boolean;
    };

    if (!email || !password) {
      res.status(422).json({ message: 'Email address and password are required.' });
      return;
    }

    const user = db.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!user || !verifyPassword(password, user.passwordHash)) {
      res.status(401).json({ message: 'Invalid email address or password.' });
      return;
    }

    const token = crypto.randomUUID();
    const ttlMs = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
    db.sessions.push({
      token,
      userId: user.id,
      expiresAt: Date.now() + ttlMs,
    });
    saveDatabase();

    res.cookie('baryobite_token', token, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: ttlMs,
    });

    res.json({
      message: 'Login successful.',
      token,
      user: sanitizeUser(user),
    });
  });

  app.post('/api/auth/register', (req: Request, res: Response) => {
    const { name, email, password, passwordConfirmation } = req.body as {
      name?: string;
      email?: string;
      password?: string;
      passwordConfirmation?: string;
    };

    if (!name || !name.trim()) {
      res.status(422).json({ message: 'Full name is required.' });
      return;
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      res.status(422).json({ message: 'Please enter a valid email address.' });
      return;
    }
    if (!password || password.length < 6) {
      res.status(422).json({ message: 'Password must be at least 6 characters long.' });
      return;
    }
    if (password !== passwordConfirmation) {
      res.status(422).json({ message: 'Password confirmation does not match.' });
      return;
    }

    const exists = db.users.some((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (exists) {
      res.status(422).json({ message: 'An account with this email address already exists.' });
      return;
    }

    const nextId = db.users.reduce((max, u) => Math.max(max, u.id), 0) + 1;
    const newUser: StoredUser = {
      id: nextId,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role: 'Manager',
      createdAt: new Date().toISOString(),
      passwordHash: hashPassword(password),
    };
    db.users.push(newUser);

    const token = crypto.randomUUID();
    const ttlMs = 24 * 60 * 60 * 1000;
    db.sessions.push({
      token,
      userId: newUser.id,
      expiresAt: Date.now() + ttlMs,
    });
    saveDatabase();

    res.cookie('baryobite_token', token, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: ttlMs,
    });

    res.status(201).json({
      message: 'Account created successfully.',
      token,
      user: sanitizeUser(newUser),
    });
  });

  app.post('/api/auth/forgot-password', (req: Request, res: Response) => {
    const { email } = req.body as { email?: string };
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      res.status(422).json({ message: 'Please provide a valid email address.' });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = db.users.find((u) => u.email.toLowerCase() === normalizedEmail);
    const resetToken = crypto.randomBytes(20).toString('hex');

    if (user) {
      db.passwordResets = db.passwordResets.filter((r) => r.email !== normalizedEmail);
      db.passwordResets.push({
        email: normalizedEmail,
        token: resetToken,
        expiresAt: Date.now() + 60 * 60 * 1000,
      });
      saveDatabase();
    }

    res.json({
      message:
        'If an account exists for that email, a password reset link has been generated.',
      resetToken: user ? resetToken : undefined,
    });
  });

  app.post('/api/auth/reset-password', (req: Request, res: Response) => {
    const { token, password, passwordConfirmation } = req.body as {
      token?: string;
      password?: string;
      passwordConfirmation?: string;
    };

    if (!token) {
      res.status(422).json({ message: 'Password reset token is missing.' });
      return;
    }
    if (!password || password.length < 6) {
      res.status(422).json({ message: 'New password must be at least 6 characters long.' });
      return;
    }
    if (password !== passwordConfirmation) {
      res.status(422).json({ message: 'Password confirmation does not match.' });
      return;
    }

    const resetRecord = db.passwordResets.find(
      (r) => r.token === token && r.expiresAt > Date.now()
    );
    if (!resetRecord) {
      res.status(400).json({ message: 'This password reset link is invalid or has expired.' });
      return;
    }

    const user = db.users.find((u) => u.email.toLowerCase() === resetRecord.email);
    if (!user) {
      res.status(404).json({ message: 'User account not found.' });
      return;
    }

    user.passwordHash = hashPassword(password);
    db.passwordResets = db.passwordResets.filter((r) => r.token !== token);
    saveDatabase();

    res.json({ message: 'Password updated successfully. You can now log in.' });
  });

  app.get('/api/auth/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    res.json({ user: sanitizeUser(req.currentUser!) });
  });

  app.post('/api/auth/logout', (req: Request, res: Response) => {
    const token = extractToken(req);
    if (token) {
      db.sessions = db.sessions.filter((s) => s.token !== token);
      saveDatabase();
    }
    res.clearCookie('baryobite_token');
    res.json({ message: 'Logged out successfully.' });
  });

  app.put('/api/auth/profile', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const { name, currentPassword, newPassword } = req.body as {
      name?: string;
      currentPassword?: string;
      newPassword?: string;
    };
    const user = req.currentUser!;
    if (name && name.trim()) {
      user.name = name.trim();
    }
    if (newPassword) {
      if (!currentPassword || !verifyPassword(currentPassword, user.passwordHash)) {
        res.status(422).json({ message: 'Current password is incorrect.' });
        return;
      }
      if (newPassword.length < 6) {
        res.status(422).json({ message: 'New password must be at least 6 characters.' });
        return;
      }
      user.passwordHash = hashPassword(newPassword);
    }
    saveDatabase();
    res.json({ message: 'Profile updated.', user: sanitizeUser(user) });
  });

  // --- DASHBOARD & ANALYTICS AGGREGATION ---
  app.get('/api/dashboard', requireAuth, (_req: Request, res: Response) => {
    const stats = computeDashboardStats(db.orders, db.expenses, db.customers);
    const weeklySummary = computeWeeklySalesSummary(db.orders);
    const monthlySeries = computeMonthlySalesSeries(db.orders, db.expenses);
    const predictive = computePredictiveForecast(monthlySeries, 3);
    const prescriptive = computePrescriptiveInsights(db.orders, db.menu, db.inventory);
    const recentOrders = [...db.orders].sort((a, b) => b.id - a.id).slice(0, 8);

    res.json({
      stats,
      weeklySummary,
      monthlySeries,
      predictive,
      prescriptive,
      recentOrders,
      settings: db.settings,
    });
  });

  // --- ORDERS CRUD ---
  app.get('/api/orders', requireAuth, (_req: Request, res: Response) => {
    const sorted = [...db.orders].sort((a, b) => b.id - a.id);
    res.json({ data: sorted });
  });

  app.post('/api/orders', requireAuth, (req: Request, res: Response) => {
    const { customerId, customerName, orderType, status, items, date } = req.body as {
      customerId?: number;
      customerName?: string;
      orderType?: Order['orderType'];
      status?: Order['status'];
      items?: Order['items'];
      date?: string;
    };

    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(422).json({ message: 'Please add at least one menu item to the order.' });
      return;
    }

    const customer = db.customers.find((c) => c.id === Number(customerId));
    const resolvedCustomerName = customer ? customer.name : customerName?.trim() || 'Walk-in Guest';
    const nextId = db.orders.reduce((max, o) => Math.max(max, o.id), 0) + 1;
    const orderCode = `ORD-${1024 + nextId}`;

    let totalAmount = 0;
    let totalCost = 0;
    const normalizedItems = items.map((it) => {
      const menuMatch = db.menu.find((m) => m.id === Number(it.menuItemId));
      const unitPrice = menuMatch ? menuMatch.price : Number(it.unitPrice) || 0;
      const unitCost = menuMatch ? menuMatch.cost : Number(it.unitCost) || 0;
      const qty = Math.max(1, Number(it.quantity) || 1);
      totalAmount += unitPrice * qty;
      totalCost += unitCost * qty;
      if (menuMatch) {
        menuMatch.soldCount += qty;
      }
      return {
        menuItemId: menuMatch ? menuMatch.id : Number(it.menuItemId) || 0,
        name: menuMatch ? menuMatch.name : it.name,
        quantity: qty,
        unitPrice,
        unitCost,
      };
    });

    const orderDate = date || new Date().toISOString().slice(0, 10);
    const newOrder: Order = {
      id: nextId,
      orderCode,
      date: orderDate,
      createdAt: new Date().toISOString(),
      customerId: customer ? customer.id : 0,
      customerName: resolvedCustomerName,
      orderType: orderType || 'Dine-In',
      status: status || 'Pending',
      items: normalizedItems,
      totalAmount,
      totalCost,
    };

    db.orders.push(newOrder);
    saveDatabase();
    res.status(201).json({ message: 'Order created.', data: newOrder });
  });

  app.patch('/api/orders/:id', requireAuth, (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const order = db.orders.find((o) => o.id === id);
    if (!order) {
      res.status(404).json({ message: 'Order not found.' });
      return;
    }
    const { status, orderType } = req.body as {
      status?: Order['status'];
      orderType?: Order['orderType'];
    };
    if (status) order.status = status;
    if (orderType) order.orderType = orderType;
    saveDatabase();
    res.json({ message: 'Order updated.', data: order });
  });

  app.delete('/api/orders/:id', requireAuth, (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const before = db.orders.length;
    db.orders = db.orders.filter((o) => o.id !== id);
    if (db.orders.length === before) {
      res.status(404).json({ message: 'Order not found.' });
      return;
    }
    saveDatabase();
    res.json({ message: 'Order deleted.' });
  });

  // --- RESERVATIONS CRUD ---
  app.get('/api/reservations', requireAuth, (_req: Request, res: Response) => {
    res.json({ data: [...db.reservations].sort((a, b) => b.id - a.id) });
  });

  app.post('/api/reservations', requireAuth, (req: Request, res: Response) => {
    const { customerName, phone, email, partySize, date, time, tableNumber, notes } = req.body as Partial<Reservation>;
    if (!customerName || !date || !time) {
      res.status(422).json({ message: 'Customer name, date, and time are required.' });
      return;
    }
    const nextId = db.reservations.reduce((max, r) => Math.max(max, r.id), 0) + 1;
    const created: Reservation = {
      id: nextId,
      reservationCode: `RES-${400 + nextId}`,
      customerName: customerName.trim(),
      phone: phone?.trim() || '0917-000-0000',
      email: email?.trim() || '',
      partySize: Math.max(1, Number(partySize) || 2),
      date,
      time,
      tableNumber: tableNumber?.trim() || `T-0${(nextId % 9) + 1}`,
      status: 'Confirmed',
      notes: notes?.trim() || '',
    };
    db.reservations.push(created);
    saveDatabase();
    res.status(201).json({ message: 'Reservation created.', data: created });
  });

  app.patch('/api/reservations/:id', requireAuth, (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const item = db.reservations.find((r) => r.id === id);
    if (!item) {
      res.status(404).json({ message: 'Reservation not found.' });
      return;
    }
    Object.assign(item, req.body);
    saveDatabase();
    res.json({ message: 'Reservation updated.', data: item });
  });

  app.delete('/api/reservations/:id', requireAuth, (req: Request, res: Response) => {
    const id = Number(req.params.id);
    db.reservations = db.reservations.filter((r) => r.id !== id);
    saveDatabase();
    res.json({ message: 'Reservation deleted.' });
  });

  // --- MENU CRUD ---
  app.get('/api/menu', requireAuth, (_req: Request, res: Response) => {
    res.json({ data: db.menu });
  });

  app.post('/api/menu', requireAuth, (req: Request, res: Response) => {
    const { name, category, price, cost, available, description } = req.body as Partial<MenuItem>;
    if (!name || price === undefined) {
      res.status(422).json({ message: 'Dish name and price are required.' });
      return;
    }
    const nextId = db.menu.reduce((max, m) => Math.max(max, m.id), 0) + 1;
    const created: MenuItem = {
      id: nextId,
      name: name.trim(),
      category: category || 'Main Course',
      price: Number(price),
      cost: Number(cost) || Math.round(Number(price) * 0.4),
      available: available ?? true,
      description: description?.trim() || '',
      soldCount: 0,
    };
    db.menu.push(created);
    saveDatabase();
    res.status(201).json({ message: 'Menu item added.', data: created });
  });

  app.patch('/api/menu/:id', requireAuth, (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const item = db.menu.find((m) => m.id === id);
    if (!item) {
      res.status(404).json({ message: 'Menu item not found.' });
      return;
    }
    Object.assign(item, req.body);
    saveDatabase();
    res.json({ message: 'Menu item updated.', data: item });
  });

  app.delete('/api/menu/:id', requireAuth, (req: Request, res: Response) => {
    const id = Number(req.params.id);
    db.menu = db.menu.filter((m) => m.id !== id);
    saveDatabase();
    res.json({ message: 'Menu item deleted.' });
  });

  // --- INVENTORY CRUD ---
  app.get('/api/inventory', requireAuth, (_req: Request, res: Response) => {
    res.json({ data: db.inventory });
  });

  app.post('/api/inventory', requireAuth, (req: Request, res: Response) => {
    const { name, category, quantity, unit, reorderLevel, unitCost, supplier } = req.body as Partial<InventoryItem>;
    if (!name || quantity === undefined) {
      res.status(422).json({ message: 'Ingredient name and quantity are required.' });
      return;
    }
    const nextId = db.inventory.reduce((max, i) => Math.max(max, i.id), 0) + 1;
    const created: InventoryItem = {
      id: nextId,
      name: name.trim(),
      category: category || 'Produce',
      quantity: Number(quantity),
      unit: unit?.trim() || 'kg',
      reorderLevel: Number(reorderLevel) || 5,
      unitCost: Number(unitCost) || 100,
      supplier: supplier?.trim() || 'Local Supplier',
      lastUpdated: new Date().toISOString().slice(0, 10),
    };
    db.inventory.push(created);
    saveDatabase();
    res.status(201).json({ message: 'Inventory item added.', data: created });
  });

  app.patch('/api/inventory/:id', requireAuth, (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const item = db.inventory.find((i) => i.id === id);
    if (!item) {
      res.status(404).json({ message: 'Inventory item not found.' });
      return;
    }
    Object.assign(item, req.body, { lastUpdated: new Date().toISOString().slice(0, 10) });
    saveDatabase();
    res.json({ message: 'Inventory updated.', data: item });
  });

  app.delete('/api/inventory/:id', requireAuth, (req: Request, res: Response) => {
    const id = Number(req.params.id);
    db.inventory = db.inventory.filter((i) => i.id !== id);
    saveDatabase();
    res.json({ message: 'Inventory item deleted.' });
  });

  // --- CUSTOMERS CRUD ---
  app.get('/api/customers', requireAuth, (_req: Request, res: Response) => {
    res.json({ data: db.customers });
  });

  app.post('/api/customers', requireAuth, (req: Request, res: Response) => {
    const { name, email, phone, loyaltyTier } = req.body as Partial<Customer>;
    if (!name || !email) {
      res.status(422).json({ message: 'Customer name and email are required.' });
      return;
    }
    const nextId = db.customers.reduce((max, c) => Math.max(max, c.id), 0) + 1;
    const created: Customer = {
      id: nextId,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone?.trim() || '0917-000-0000',
      loyaltyTier: loyaltyTier || 'Bronze',
      joinedDate: new Date().toISOString().slice(0, 10),
    };
    db.customers.push(created);
    saveDatabase();
    res.status(201).json({ message: 'Customer added.', data: created });
  });

  app.patch('/api/customers/:id', requireAuth, (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const item = db.customers.find((c) => c.id === id);
    if (!item) {
      res.status(404).json({ message: 'Customer not found.' });
      return;
    }
    Object.assign(item, req.body);
    saveDatabase();
    res.json({ message: 'Customer updated.', data: item });
  });

  app.delete('/api/customers/:id', requireAuth, (req: Request, res: Response) => {
    const id = Number(req.params.id);
    db.customers = db.customers.filter((c) => c.id !== id);
    saveDatabase();
    res.json({ message: 'Customer deleted.' });
  });

  // --- EXPENSES ---
  app.get('/api/expenses', requireAuth, (_req: Request, res: Response) => {
    res.json({ data: [...db.expenses].sort((a, b) => b.id - a.id) });
  });

  app.post('/api/expenses', requireAuth, (req: Request, res: Response) => {
    const { date, category, description, amount } = req.body as Partial<Expense>;
    if (!description || amount === undefined) {
      res.status(422).json({ message: 'Description and amount are required.' });
      return;
    }
    const nextId = db.expenses.reduce((max, e) => Math.max(max, e.id), 0) + 1;
    const created: Expense = {
      id: nextId,
      date: date || new Date().toISOString().slice(0, 10),
      category: category || 'Ingredients',
      description: description.trim(),
      amount: Number(amount),
    };
    db.expenses.push(created);
    saveDatabase();
    res.status(201).json({ message: 'Expense recorded.', data: created });
  });

  // --- SETTINGS ---
  app.get('/api/settings', requireAuth, (_req: Request, res: Response) => {
    res.json({ data: db.settings });
  });

  app.put('/api/settings', requireAuth, (req: Request, res: Response) => {
    Object.assign(db.settings, req.body);
    saveDatabase();
    res.json({ message: 'Settings saved.', data: db.settings });
  });

  // --- VITE / STATIC SERVING ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`BaryoBite server running on http://localhost:${PORT}`);
  });
}

startServer();
