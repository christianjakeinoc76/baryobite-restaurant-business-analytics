import React, { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';
import { TrendingUp, Lightbulb, BarChart3, ArrowUpRight } from 'lucide-react';
import { api } from '../api/client';
import { formatCurrency } from '../utils/analytics';
import type {
  DashboardStats,
  ForecastPoint,
  MonthlySeriesPoint,
} from '../utils/analytics';
import type { MenuItem, Order, PrescriptiveInsight } from '../types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler
);

interface AnalyticsResponse {
  stats: DashboardStats;
  monthlySeries: MonthlySeriesPoint[];
  predictive: {
    forecast: ForecastPoint[];
    monthlyGrowthRatePct: number;
    nextMonthProjectedSales: number;
  };
  prescriptive: PrescriptiveInsight[];
}

export default function BusinessAnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'descriptive' | 'predictive' | 'prescriptive'>('all');

  useEffect(() => {
    Promise.all([
      api.get<AnalyticsResponse>('/dashboard'),
      api.get<{ data: MenuItem[] }>('/menu'),
      api.get<{ data: Order[] }>('/orders'),
    ])
      .then(([dashRes, menuRes, ordRes]) => {
        setAnalytics(dashRes.data);
        setMenu(menuRes.data.data);
        setOrders(ordRes.data.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const monthly = analytics?.monthlySeries || [];
  const forecast = analytics?.predictive?.forecast || [];
  const prescriptive = analytics?.prescriptive || [];

  // Combined historical + predictive line chart
  const combinedLabels = [
    ...monthly.map((m) => m.label),
    ...forecast.map((f) => `${f.label} (Forecast)`),
  ];

  const historicalData = [
    ...monthly.map((m) => m.sales),
    ...forecast.map(() => null),
  ];

  const forecastData = [
    ...monthly.map((m, idx) => (idx === monthly.length - 1 ? m.sales : null)),
    ...forecast.map((f) => f.projectedSales),
  ];

  const lineChartData = {
    labels: combinedLabels,
    datasets: [
      {
        label: 'Actual Revenue',
        data: historicalData,
        borderColor: '#2563EB',
        backgroundColor: 'rgba(37, 99, 235, 0.08)',
        fill: true,
        tension: 0.35,
        pointRadius: 4,
      },
      {
        label: 'Predicted Revenue (Linear Trend)',
        data: forecastData,
        borderColor: '#16A34A',
        borderDash: [6, 6],
        backgroundColor: 'rgba(22, 163, 74, 0.08)',
        fill: true,
        tension: 0.35,
        pointRadius: 4,
      },
    ],
  };

  // Category revenue breakdown
  const categoryTotals: Record<string, number> = {
    'Main Course': 0,
    Appetizer: 0,
    Dessert: 0,
    Beverage: 0,
  };
  for (const item of menu) {
    categoryTotals[item.category] =
      (categoryTotals[item.category] || 0) + item.price * item.soldCount;
  }

  const doughnutData = {
    labels: Object.keys(categoryTotals),
    datasets: [
      {
        data: Object.values(categoryTotals),
        backgroundColor: ['#2563EB', '#16A34A', '#F59E0B', '#DC2626'],
        borderWidth: 0,
      },
    ],
  };

  // Order Type breakdown
  const channelCounts = orders.reduce<Record<string, number>>((acc, o) => {
    if (o.status !== 'Cancelled') {
      acc[o.orderType] = (acc[o.orderType] || 0) + 1;
    }
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#0F172A]">
            Business Analytics
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Descriptive performance, predictive revenue forecasting, and prescriptive actions
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl w-fit">
          {[
            { id: 'all', label: 'All Insights' },
            { id: 'descriptive', label: 'Descriptive' },
            { id: 'predictive', label: 'Predictive' },
            { id: 'prescriptive', label: 'Prescriptive' },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id as typeof activeTab)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                activeTab === t.id
                  ? 'bg-white text-[#0F172A] shadow-2xs'
                  : 'text-slate-600 hover:text-[#0F172A]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Top KPI Summary Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5">
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600">
            <BarChart3 className="w-4 h-4" />
            <span>Descriptive &middot; Net Profit Margin</span>
          </div>
          <div className="mt-2 font-display text-2xl font-bold font-mono-tabular text-[#0F172A]">
            {loading ? '—' : `${(analytics?.stats?.profitMarginPct ?? 0).toFixed(1)}%`}
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Net profit of {formatCurrency(analytics?.stats?.netProfit ?? 0)} across{' '}
            {analytics?.stats?.completedOrders ?? 0} completed orders
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 p-5">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600">
            <TrendingUp className="w-4 h-4" />
            <span>Predictive &middot; Next Month Forecast</span>
          </div>
          <div className="mt-2 font-display text-2xl font-bold font-mono-tabular text-[#0F172A]">
            {loading
              ? '—'
              : formatCurrency(analytics?.predictive?.nextMonthProjectedSales ?? 0)}
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Projected monthly growth rate:{' '}
            <span className="font-semibold text-emerald-600 font-mono-tabular">
              {(analytics?.predictive?.monthlyGrowthRatePct ?? 0) >= 0 ? '+' : ''}
              {(analytics?.predictive?.monthlyGrowthRatePct ?? 0).toFixed(1)}%
            </span>
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 p-5">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-600">
            <Lightbulb className="w-4 h-4" />
            <span>Prescriptive &middot; Actionable Recommendations</span>
          </div>
          <div className="mt-2 font-display text-2xl font-bold font-mono-tabular text-[#0F172A]">
            {loading ? '—' : `${prescriptive.length} Actions`}
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Generated from live inventory, menu margins, and channel velocity
          </p>
        </div>
      </div>

      {/* Descriptive & Predictive Charts */}
      {(activeTab === 'all' || activeTab === 'descriptive' || activeTab === 'predictive') && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/90 p-6">
            <div className="mb-4">
              <h2 className="font-display text-lg font-bold text-[#0F172A]">
                Revenue Trajectory &amp; 3-Month Predictive Forecast
              </h2>
              <p className="text-xs text-slate-500">
                Historical monthly sales paired with least-squares linear regression projection
              </p>
            </div>
            <div className="h-72" data-testid="predictive-revenue-chart">
              <Line
                data={lineChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { position: 'bottom' },
                  },
                  scales: {
                    x: { grid: { display: false } },
                    y: { grid: { color: '#F1F5F9' } },
                  },
                }}
              />
            </div>

            {forecast.length > 0 && (
              <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3">
                {forecast.map((f) => (
                  <div key={f.label} className="rounded-xl bg-slate-50 p-3">
                    <div className="text-xs font-medium text-slate-500">{f.label} Forecast</div>
                    <div className="mt-1 font-mono-tabular text-base font-bold text-[#0F172A]">
                      {formatCurrency(f.projectedSales)}
                    </div>
                    <div className="text-[11px] font-mono-tabular text-slate-500">
                      Range: {formatCurrency(f.lowerBound)} – {formatCurrency(f.upperBound)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/90 p-6 flex flex-col justify-between">
            <div>
              <h2 className="font-display text-lg font-bold text-[#0F172A]">
                Sales by Menu Category
              </h2>
              <p className="text-xs text-slate-500 mb-4">
                Descriptive revenue share across dish categories
              </p>
              <div className="h-56" data-testid="category-doughnut-chart">
                <Doughnut
                  data={doughnutData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { position: 'bottom' },
                    },
                  }}
                />
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100 space-y-2">
              <div className="text-xs font-semibold text-slate-500">Order Channel Mix</div>
              {Object.entries(channelCounts).map(([channel, count]) => (
                <div key={channel} className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-700">{channel}</span>
                  <span className="font-mono-tabular font-semibold text-[#0F172A]">
                    {count} orders
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Prescriptive Analytics Recommendations */}
      {(activeTab === 'all' || activeTab === 'prescriptive') && (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6">
          <div className="mb-4">
            <h2 className="font-display text-lg font-bold text-[#0F172A]">
              Prescriptive Business Recommendations
            </h2>
            <p className="text-xs text-slate-500">
              Data-driven operational actions computed from current inventory, menu profitability, and order patterns
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {prescriptive.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-slate-200 p-4 flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-semibold text-blue-600">{item.category}</span>
                    <span
                      className={`font-semibold ${
                        item.priority === 'High'
                          ? 'text-red-600'
                          : item.priority === 'Medium'
                          ? 'text-amber-600'
                          : 'text-slate-500'
                      }`}
                    >
                      {item.priority} Priority
                    </span>
                  </div>
                  <h3 className="mt-1.5 font-display text-base font-bold text-[#0F172A]">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-xs text-slate-600">{item.finding}</p>
                </div>

                <div className="pt-3 border-t border-slate-100 space-y-1.5 text-xs">
                  <div>
                    <span className="font-semibold text-[#0F172A]">Recommended Action: </span>
                    <span className="text-slate-600">{item.recommendedAction}</span>
                  </div>
                  <div className="flex items-center gap-1 text-emerald-700 font-medium">
                    <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
                    <span>{item.expectedImpact}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
