import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingBag,
  DollarSign,
  Receipt,
  Users,
  Plus,
  ArrowUpRight,
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/analytics';
import { OrderStatusText } from '../components/StatusText';
import NewOrderModal from '../components/NewOrderModal';
import type { Order, RestaurantSettings } from '../types';
import type {
  DashboardStats,
  MonthlySeriesPoint,
  WeeklyDaySummary,
} from '../utils/analytics';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler
);

interface DashboardPayload {
  stats: DashboardStats;
  weeklySummary: {
    days: WeeklyDaySummary[];
    weeklyTotal: number;
    weeklyOrders: number;
    topChannel: string;
  };
  monthlySeries: MonthlySeriesPoint[];
  recentOrders: Order[];
  settings: RestaurantSettings;
}

export default function OverviewPage() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [newOrderOpen, setNewOrderOpen] = useState(false);

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await api.get<DashboardPayload>('/dashboard');
      setData(res.data);
    } catch {
      // handled gracefully
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const currency = data?.settings?.currency || '₱';
  const stats = data?.stats;
  const weekly = data?.weeklySummary;
  const monthly = data?.monthlySeries || [];
  const recentOrders = (data?.recentOrders || []).filter((o) =>
    statusFilter === 'All' ? true : o.status === statusFilter
  );

  const maxWeeklyDaySales = Math.max(
    1,
    ...(weekly?.days.map((d) => d.sales) || [1])
  );

  const chartData = {
    labels: monthly.map((m) => m.label),
    datasets: [
      {
        label: 'Monthly Sales',
        data: monthly.map((m) => m.sales),
        backgroundColor: '#2563EB',
        borderRadius: 6,
        barPercentage: 0.65,
      },
      {
        label: 'Expenses',
        data: monthly.map((m) => m.expenses),
        backgroundColor: '#F59E0B',
        borderRadius: 6,
        barPercentage: 0.65,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          usePointStyle: true,
          boxWidth: 8,
          padding: 16,
          font: {
            family: "'DM Sans', sans-serif",
            size: 12,
          },
        },
      },
      tooltip: {
        backgroundColor: '#0F172A',
        padding: 10,
        cornerRadius: 8,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          font: { family: "'DM Sans', sans-serif", size: 11 },
          color: '#64748B',
        },
      },
      y: {
        grid: { color: '#F1F5F9' },
        ticks: {
          font: { family: "'JetBrains Mono', monospace", size: 11 },
          color: '#64748B',
        },
      },
    },
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A]">
            Overview
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Welcome back, {user?.name || 'Manager'}! Here&apos;s what&apos;s happening at{' '}
            {data?.settings?.restaurantName || 'BaryoBite'} today.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setNewOrderOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors shadow-xs cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Order</span>
        </button>
      </div>

      {/* 4 Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
        {/* Total Orders */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">Total Orders</span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 font-display text-2xl font-bold font-mono-tabular text-[#0F172A]">
            {loading ? '—' : stats?.totalOrders ?? 0}
          </div>
          <p className="mt-1.5 text-xs text-slate-500">
            <span className="font-semibold text-emerald-600">
              {stats?.completedOrders ?? 0} completed
            </span>{' '}
            &middot; {weekly?.topChannel || 'Dine-In'} leading
          </p>
        </div>

        {/* Total Sales */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">Total Sales</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 font-display text-2xl font-bold font-mono-tabular text-[#0F172A]">
            {loading ? '—' : formatCurrency(stats?.totalSales ?? 0, currency)}
          </div>
          <p className="mt-1.5 text-xs text-slate-500">
            Avg. ticket{' '}
            <span className="font-semibold font-mono-tabular text-[#0F172A]">
              {formatCurrency(stats?.averageOrderValue ?? 0, currency)}
            </span>
          </p>
        </div>

        {/* Total Expenses */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">Total Expenses</span>
            <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
              <Receipt className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 font-display text-2xl font-bold font-mono-tabular text-[#0F172A]">
            {loading ? '—' : formatCurrency(stats?.totalExpenses ?? 0, currency)}
          </div>
          <p className="mt-1.5 text-xs text-slate-500">
            Net profit{' '}
            <span className="font-semibold font-mono-tabular text-emerald-600">
              {formatCurrency(stats?.netProfit ?? 0, currency)}
            </span>
          </p>
        </div>

        {/* Total Customers */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">Total Customers</span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 font-display text-2xl font-bold font-mono-tabular text-[#0F172A]">
            {loading ? '—' : stats?.totalCustomers ?? 0}
          </div>
          <p className="mt-1.5 text-xs text-slate-500">
            Registered loyalty &amp; repeat diners
          </p>
        </div>
      </div>

      {/* Main Content Grid: Recent Orders (Left) + Weekly Summary & Monthly Chart (Right) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Recent Orders Table */}
        <div className="xl:col-span-8 bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-lg font-bold text-[#0F172A]">Recent Orders</h2>
                <p className="text-xs text-slate-500">
                  Latest restaurant transactions across Dine-In, Takeout, and Delivery
                </p>
              </div>
              <Link
                to="/orders"
                className="sm:hidden inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 shrink-0"
              >
                <span>View all</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
                {['All', 'Completed', 'Preparing', 'Pending'].map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatusFilter(st)}
                    className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                      statusFilter === st
                        ? 'bg-white text-[#0F172A] shadow-2xs'
                        : 'text-slate-600 hover:text-[#0F172A]'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>

              <Link
                to="/orders"
                className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 px-2 py-1 whitespace-nowrap shrink-0"
              >
                <span>View all</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-xs font-semibold text-slate-500">
                  <th className="py-3 px-5">Order ID</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Order Type</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-5 text-right">Total Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-400">
                      Loading recent orders...
                    </td>
                  </tr>
                ) : recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-500">
                      No orders match the selected filter.
                    </td>
                  </tr>
                ) : (
                  recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-5 font-mono-tabular font-semibold text-[#0F172A] whitespace-nowrap">
                        {order.orderCode}
                      </td>
                      <td className="py-3.5 px-4 font-mono-tabular text-xs text-slate-600 whitespace-nowrap">
                        {order.date}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-[#0F172A]">
                        {order.customerName}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                        {order.orderType}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <OrderStatusText status={order.status} />
                      </td>
                      <td className="py-3.5 px-5 text-right font-mono-tabular font-semibold text-[#0F172A] whitespace-nowrap">
                        {formatCurrency(order.totalAmount, currency)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Dashboard Panel: Weekly Sales Summary + Monthly Sales Chart */}
        <div className="xl:col-span-4 space-y-6">
          {/* Weekly Sales Summary */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-base font-bold text-[#0F172A]">
                  Weekly Sales Summary
                </h2>
                <p className="text-xs text-slate-500">Revenue distribution by day of week</p>
              </div>
              <span className="font-mono-tabular text-sm font-bold text-blue-600">
                {formatCurrency(weekly?.weeklyTotal ?? 0, currency)}
              </span>
            </div>

            <div className="mt-4 space-y-2.5">
              {(weekly?.days || []).map((d) => {
                const pct = Math.round((d.sales / maxWeeklyDaySales) * 100);
                return (
                  <div key={d.day} className="flex items-center gap-3 text-xs">
                    <span className="w-8 font-medium text-slate-600">{d.day}</span>
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full transition-all duration-300"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-20 text-right font-mono-tabular font-semibold text-[#0F172A]">
                      {formatCurrency(d.sales, currency)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Monthly Sales Chart */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs">
            <div className="mb-4">
              <h2 className="font-display text-base font-bold text-[#0F172A]">
                Monthly Sales Chart
              </h2>
              <p className="text-xs text-slate-500">
                Actual monthly revenue vs. operating expenses
              </p>
            </div>
            <div className="h-64" data-testid="monthly-sales-chart">
              {monthly.length > 0 ? (
                <Bar data={chartData} options={chartOptions} />
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  No monthly data available yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <NewOrderModal
        open={newOrderOpen}
        onClose={() => setNewOrderOpen(false)}
        onCreated={fetchDashboard}
      />
    </div>
  );
}
