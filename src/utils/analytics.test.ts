import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeDashboardStats,
  computeMonthlySalesSeries,
  computePredictiveForecast,
  computePrescriptiveInsights,
  computeWeeklySalesSummary,
  formatCurrency,
} from './analytics';
import type { Customer, Expense, InventoryItem, MenuItem, Order } from '../types';

const sampleOrders: Order[] = [
  {
    id: 1,
    orderCode: 'ORD-1001',
    date: '2026-09-14', // Monday
    createdAt: '2026-09-14T12:00:00Z',
    customerId: 1,
    customerName: 'Maria Santos',
    orderType: 'Dine-In',
    status: 'Completed',
    items: [{ menuItemId: 1, name: 'Chicken Inasal', quantity: 2, unitPrice: 250, unitCost: 100 }],
    totalAmount: 500,
    totalCost: 200,
  },
  {
    id: 2,
    orderCode: 'ORD-1002',
    date: '2026-10-16', // Friday
    createdAt: '2026-10-16T18:30:00Z',
    customerId: 2,
    customerName: 'Juan Dela Cruz',
    orderType: 'Delivery',
    status: 'Completed',
    items: [{ menuItemId: 2, name: 'Sisig Platter', quantity: 2, unitPrice: 400, unitCost: 150 }],
    totalAmount: 800,
    totalCost: 300,
  },
  {
    id: 3,
    orderCode: 'ORD-1003',
    date: '2026-10-17', // Saturday
    createdAt: '2026-10-17T19:00:00Z',
    customerId: 1,
    customerName: 'Maria Santos',
    orderType: 'Dine-In',
    status: 'Cancelled',
    items: [],
    totalAmount: 300,
    totalCost: 120,
  },
];

const sampleExpenses: Expense[] = [
  { id: 1, date: '2026-09-05', category: 'Ingredients', description: 'Poultry', amount: 200 },
  { id: 2, date: '2026-10-05', category: 'Utilities', description: 'Electricity', amount: 300 },
];

const sampleCustomers: Customer[] = [
  { id: 1, name: 'Maria Santos', email: 'maria@example.com', phone: '09171234567', loyaltyTier: 'Gold', joinedDate: '2026-01-10' },
  { id: 2, name: 'Juan Dela Cruz', email: 'juan@example.com', phone: '09187654321', loyaltyTier: 'Silver', joinedDate: '2026-03-15' },
];

test('formatCurrency formats numbers with peso symbol and 2 decimals', () => {
  assert.equal(formatCurrency(1250.5), '₱1,250.50');
  assert.equal(formatCurrency(0), '₱0.00');
});

test('computeDashboardStats excludes cancelled orders from sales and computes net profit', () => {
  const stats = computeDashboardStats(sampleOrders, sampleExpenses, sampleCustomers);
  assert.equal(stats.totalOrders, 3);
  assert.equal(stats.completedOrders, 2);
  assert.equal(stats.totalSales, 1300);
  assert.equal(stats.totalExpenses, 500);
  assert.equal(stats.totalCustomers, 2);
  assert.equal(stats.netProfit, 800);
  assert.equal(stats.averageOrderValue, 650);
});

test('computeWeeklySalesSummary groups valid orders by weekday', () => {
  const summary = computeWeeklySalesSummary(sampleOrders);
  assert.equal(summary.weeklyTotal, 1300);
  assert.equal(summary.weeklyOrders, 2);
  const mon = summary.days.find((d) => d.day === 'Mon');
  const fri = summary.days.find((d) => d.day === 'Fri');
  assert.equal(mon?.sales, 500);
  assert.equal(fri?.sales, 800);
});

test('computeMonthlySalesSeries and computePredictiveForecast project upward trend', () => {
  const series = computeMonthlySalesSeries(sampleOrders, sampleExpenses);
  assert.equal(series.length, 2);
  assert.equal(series[0].monthKey, '2026-09');
  assert.equal(series[0].sales, 500);
  assert.equal(series[1].monthKey, '2026-10');
  assert.equal(series[1].sales, 800);

  const prediction = computePredictiveForecast(series, 3);
  assert.equal(prediction.forecast.length, 3);
  assert.equal(prediction.nextMonthProjectedSales, 1100);
  assert.equal(prediction.forecast[0].label, 'Nov 2026');
});

test('computePrescriptiveInsights detects low-stock inventory and high-margin menu items', () => {
  const menu: MenuItem[] = [
    { id: 1, name: 'Calamansi Juice', category: 'Beverage', price: 100, cost: 20, available: true, description: '', soldCount: 50 },
    { id: 2, name: 'Crispy Pata', category: 'Main Course', price: 850, cost: 450, available: true, description: '', soldCount: 5 },
    { id: 3, name: 'Halo-Halo', category: 'Dessert', price: 180, cost: 70, available: true, description: '', soldCount: 30 },
  ];
  const inventory: InventoryItem[] = [
    { id: 1, name: 'Whole Chicken', category: 'Meat & Poultry', quantity: 4, unit: 'kg', reorderLevel: 10, unitCost: 180, supplier: 'Baryo Farms', lastUpdated: '2026-10-17' },
  ];

  const insights = computePrescriptiveInsights(sampleOrders, menu, inventory);
  assert.ok(insights.some((i) => i.category === 'Inventory' && i.priority === 'High'));
  assert.ok(insights.some((i) => i.category === 'Menu Margin' && i.title.includes('Calamansi Juice')));
});
