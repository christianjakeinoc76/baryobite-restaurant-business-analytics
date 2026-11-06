import type {
  Customer,
  Expense,
  InventoryItem,
  MenuItem,
  Order,
  PrescriptiveInsight,
} from '../types';

export function formatCurrency(amount: number, currency = '₱'): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  return `${currency}${safe.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export interface DashboardStats {
  totalOrders: number;
  completedOrders: number;
  totalSales: number;
  totalExpenses: number;
  totalCustomers: number;
  netProfit: number;
  averageOrderValue: number;
  profitMarginPct: number;
}

export function computeDashboardStats(
  orders: Order[],
  expenses: Expense[],
  customers: Customer[]
): DashboardStats {
  const validOrders = orders.filter((o) => o.status !== 'Cancelled');
  const totalOrders = orders.length;
  const completedOrders = orders.filter((o) => o.status === 'Completed').length;
  const totalSales = validOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalCustomers = customers.length;
  const netProfit = totalSales - totalExpenses;
  const averageOrderValue = validOrders.length > 0 ? totalSales / validOrders.length : 0;
  const profitMarginPct = totalSales > 0 ? (netProfit / totalSales) * 100 : 0;

  return {
    totalOrders,
    completedOrders,
    totalSales,
    totalExpenses,
    totalCustomers,
    netProfit,
    averageOrderValue,
    profitMarginPct,
  };
}

export interface WeeklyDaySummary {
  day: string;
  sales: number;
  orders: number;
}

export function computeWeeklySalesSummary(orders: Order[]): {
  days: WeeklyDaySummary[];
  weeklyTotal: number;
  weeklyOrders: number;
  topChannel: string;
} {
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const buckets: Record<string, { sales: number; orders: number }> = {
    Mon: { sales: 0, orders: 0 },
    Tue: { sales: 0, orders: 0 },
    Wed: { sales: 0, orders: 0 },
    Thu: { sales: 0, orders: 0 },
    Fri: { sales: 0, orders: 0 },
    Sat: { sales: 0, orders: 0 },
    Sun: { sales: 0, orders: 0 },
  };

  const channelCounts: Record<string, number> = {
    'Dine-In': 0,
    Takeout: 0,
    Delivery: 0,
  };

  const validOrders = orders.filter((o) => o.status !== 'Cancelled');
  for (const order of validOrders) {
    const parsed = new Date(`${order.date}T12:00:00`);
    const dayLabel = Number.isNaN(parsed.getTime()) ? 'Mon' : dayNames[parsed.getDay()];
    if (buckets[dayLabel]) {
      buckets[dayLabel].sales += order.totalAmount;
      buckets[dayLabel].orders += 1;
    }
    channelCounts[order.orderType] = (channelCounts[order.orderType] || 0) + 1;
  }

  const orderedDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => ({
    day,
    sales: buckets[day].sales,
    orders: buckets[day].orders,
  }));

  const weeklyTotal = orderedDays.reduce((s, d) => s + d.sales, 0);
  const weeklyOrders = orderedDays.reduce((s, d) => s + d.orders, 0);
  const topChannel =
    Object.entries(channelCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Dine-In';

  return { days: orderedDays, weeklyTotal, weeklyOrders, topChannel };
}

export interface MonthlySeriesPoint {
  monthKey: string; // YYYY-MM
  label: string; // e.g. Jun 2026
  sales: number;
  expenses: number;
  profit: number;
}

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function computeMonthlySalesSeries(
  orders: Order[],
  expenses: Expense[]
): MonthlySeriesPoint[] {
  const map = new Map<string, { sales: number; expenses: number }>();

  for (const order of orders) {
    if (order.status === 'Cancelled') continue;
    const key = order.date.slice(0, 7);
    const entry = map.get(key) || { sales: 0, expenses: 0 };
    entry.sales += order.totalAmount;
    map.set(key, entry);
  }

  for (const exp of expenses) {
    const key = exp.date.slice(0, 7);
    const entry = map.get(key) || { sales: 0, expenses: 0 };
    entry.expenses += exp.amount;
    map.set(key, entry);
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([monthKey, val]) => {
      const [y, m] = monthKey.split('-');
      const mIdx = Math.max(0, Math.min(11, parseInt(m, 10) - 1));
      return {
        monthKey,
        label: `${MONTH_SHORT[mIdx]} ${y}`,
        sales: val.sales,
        expenses: val.expenses,
        profit: val.sales - val.expenses,
      };
    });
}

export interface ForecastPoint {
  label: string;
  projectedSales: number;
  lowerBound: number;
  upperBound: number;
}

export function computePredictiveForecast(
  series: MonthlySeriesPoint[],
  periods = 3
): {
  forecast: ForecastPoint[];
  monthlyGrowthRatePct: number;
  nextMonthProjectedSales: number;
} {
  if (series.length === 0) {
    return { forecast: [], monthlyGrowthRatePct: 0, nextMonthProjectedSales: 0 };
  }

  const n = series.length;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;

  for (let i = 0; i < n; i++) {
    const y = series[i].sales;
    sumX += i;
    sumY += y;
    sumXY += i * y;
    sumXX += i * i;
  }

  const denominator = n * sumXX - sumX * sumX;
  const slope = denominator !== 0 ? (n * sumXY - sumX * sumY) / denominator : 0;
  const intercept = (sumY - slope * sumX) / n;

  const lastPoint = series[n - 1];
  const [lastYearStr, lastMonthStr] = lastPoint.monthKey.split('-');
  let year = parseInt(lastYearStr, 10);
  let month = parseInt(lastMonthStr, 10);

  const forecast: ForecastPoint[] = [];
  for (let step = 1; step <= periods; step++) {
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
    const idx = n - 1 + step;
    const rawProjected = Math.max(0, Math.round(intercept + slope * idx));
    const margin = Math.round(rawProjected * 0.08 * step);
    forecast.push({
      label: `${MONTH_SHORT[month - 1]} ${year}`,
      projectedSales: rawProjected,
      lowerBound: Math.max(0, rawProjected - margin),
      upperBound: rawProjected + margin,
    });
  }

  const avgSales = sumY / n;
  const monthlyGrowthRatePct = avgSales > 0 ? (slope / avgSales) * 100 : 0;
  const nextMonthProjectedSales = forecast[0]?.projectedSales ?? 0;

  return {
    forecast,
    monthlyGrowthRatePct,
    nextMonthProjectedSales,
  };
}

export function computePrescriptiveInsights(
  orders: Order[],
  menuItems: MenuItem[],
  inventoryItems: InventoryItem[]
): PrescriptiveInsight[] {
  const insights: PrescriptiveInsight[] = [];

  // 1. Low-stock inventory check
  const lowStock = inventoryItems.filter((item) => item.quantity <= item.reorderLevel);
  if (lowStock.length > 0) {
    const names = lowStock.slice(0, 3).map((i) => `${i.name} (${i.quantity} ${i.unit})`).join(', ');
    insights.push({
      id: 'presc-inventory-restock',
      category: 'Inventory',
      priority: 'High',
      title: `Restock ${lowStock.length} Low-Inventory Ingredient${lowStock.length > 1 ? 's' : ''}`,
      finding: `Critical stock levels detected for ${names}.`,
      recommendedAction: `Issue purchase orders to primary suppliers (${lowStock[0].supplier}) within 24 hours to prevent menu item stockouts.`,
      expectedImpact: 'Prevents an estimated 12–18% lost order fulfillment during peak service.',
    });
  }

  // 2. High-margin menu star promotion
  const availableMenu = menuItems.filter((m) => m.available && m.price > 0);
  if (availableMenu.length > 0) {
    const sortedByMargin = [...availableMenu].sort(
      (a, b) => (b.price - b.cost) / b.price - (a.price - a.cost) / a.price
    );
    const star = sortedByMargin[0];
    const marginPct = Math.round(((star.price - star.cost) / star.price) * 100);
    insights.push({
      id: 'presc-menu-margin',
      category: 'Menu Margin',
      priority: 'High',
      title: `Feature High-Margin Dish: ${star.name}`,
      finding: `${star.name} delivers a ${marginPct}% gross margin (₱${(star.price - star.cost).toFixed(2)} profit per serving).`,
      recommendedAction: `Bundle ${star.name} with high-volume beverages or feature it at the top of Dine-In & Delivery menus.`,
      expectedImpact: 'Increases overall gross profit margin by +3.5% to +5.0% over 30 days.',
    });
  }

  // 3. Order channel optimization
  const validOrders = orders.filter((o) => o.status !== 'Cancelled');
  if (validOrders.length > 0) {
    const byType: Record<string, { count: number; revenue: number }> = {};
    for (const o of validOrders) {
      if (!byType[o.orderType]) byType[o.orderType] = { count: 0, revenue: 0 };
      byType[o.orderType].count += 1;
      byType[o.orderType].revenue += o.totalAmount;
    }
    const sortedChannels = Object.entries(byType).sort((a, b) => b[1].revenue - a[1].revenue);
    const [topType, topData] = sortedChannels[0];
    const sharePct = Math.round((topData.revenue / validOrders.reduce((s, o) => s + o.totalAmount, 0)) * 100);
    insights.push({
      id: 'presc-channel-ops',
      category: 'Operations',
      priority: 'Medium',
      title: `Optimize ${topType} Service Capacity (${sharePct}% of Revenue)`,
      finding: `${topType} accounts for ${topData.count} orders and ${formatCurrency(topData.revenue)} in total revenue.`,
      recommendedAction:
        topType === 'Dine-In'
          ? 'Allocate additional floor staff during Friday–Sunday dinner hours and pre-prep top-selling platters.'
          : `Streamline ${topType} packaging stations and offer combo upsells at checkout.`,
      expectedImpact: 'Reduces average order turnaround time by 15% and lifts ticket size by 8%.',
    });
  }

  // 4. Slow-moving menu item action
  if (availableMenu.length > 2) {
    const lowestSold = [...availableMenu].sort((a, b) => a.soldCount - b.soldCount)[0];
    insights.push({
      id: 'presc-slow-mover',
      category: 'Customer Retention',
      priority: 'Low',
      title: `Revitalize Slow-Moving Item: ${lowestSold.name}`,
      finding: `${lowestSold.name} has the lowest order velocity (${lowestSold.soldCount} units sold) among active menu items.`,
      recommendedAction: `Run a limited-time 15% weekday lunch promotion or pair ${lowestSold.name} as a discounted add-on.`,
      expectedImpact: 'Improves inventory turnover and reduces perishable ingredient waste by 20%.',
    });
  }

  return insights;
}
