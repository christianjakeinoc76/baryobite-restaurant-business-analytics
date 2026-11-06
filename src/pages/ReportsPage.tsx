import React, { useEffect, useState, useCallback } from 'react';
import { Download, Printer, Plus, X } from 'lucide-react';
import { api, extractErrorMessage } from '../api/client';
import { formatCurrency } from '../utils/analytics';
import type { DashboardStats, MonthlySeriesPoint } from '../utils/analytics';
import type { Expense } from '../types';

export default function ReportsPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [monthly, setMonthly] = useState<MonthlySeriesPoint[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);

  const [expDate, setExpDate] = useState(new Date().toISOString().slice(0, 10));
  const [expCategory, setExpCategory] = useState<Expense['category']>('Ingredients');
  const [expDesc, setExpDesc] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [error, setError] = useState('');

  const loadReports = useCallback(async () => {
    try {
      const [dashRes, expRes] = await Promise.all([
        api.get<{ stats: DashboardStats; monthlySeries: MonthlySeriesPoint[] }>('/dashboard'),
        api.get<{ data: Expense[] }>('/expenses'),
      ]);
      setStats(dashRes.data.stats);
      setMonthly(dashRes.data.monthlySeries);
      setExpenses(expRes.data.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const handleExportCsv = () => {
    const headers = ['Month', 'Gross Sales', 'Operating Expenses', 'Net Profit'];
    const rows = monthly.map((m) => [
      m.label,
      m.sales.toFixed(2),
      m.expenses.toFixed(2),
      m.profit.toFixed(2),
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `baryobite-financial-report-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!expDesc.trim() || !expAmount) {
      setError('Description and amount are required.');
      return;
    }
    try {
      await api.post('/expenses', {
        date: expDate,
        category: expCategory,
        description: expDesc.trim(),
        amount: Number(expAmount),
      });
      setExpDesc('');
      setExpAmount('');
      setExpenseModalOpen(false);
      loadReports();
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to record expense.'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 no-print">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#0F172A]">Reports</h1>
          <p className="mt-1 text-sm text-slate-600">
            Monthly profit &amp; loss statements, operating expenses, and CSV exports
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => setExpenseModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-[#0F172A] hover:bg-slate-50 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Record Expense</span>
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-[#0F172A] hover:bg-slate-50 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download CSV</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-700 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5">
          <span className="text-xs font-medium text-slate-500">Gross Revenue</span>
          <div className="mt-2 font-display text-2xl font-bold font-mono-tabular text-[#0F172A]">
            {loading ? '—' : formatCurrency(stats?.totalSales ?? 0)}
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5">
          <span className="text-xs font-medium text-slate-500">Operating Expenses</span>
          <div className="mt-2 font-display text-2xl font-bold font-mono-tabular text-red-600">
            {loading ? '—' : formatCurrency(stats?.totalExpenses ?? 0)}
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5">
          <span className="text-xs font-medium text-slate-500">Net Profit</span>
          <div className="mt-2 font-display text-2xl font-bold font-mono-tabular text-emerald-600">
            {loading ? '—' : formatCurrency(stats?.netProfit ?? 0)}
          </div>
        </div>
      </div>

      {/* Monthly P&L Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-display text-lg font-bold text-[#0F172A]">
            Monthly Profit &amp; Loss Statement
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-xs font-semibold text-slate-500">
                <th className="py-3.5 px-5">Month</th>
                <th className="py-3.5 px-4 text-right">Gross Sales</th>
                <th className="py-3.5 px-4 text-right">Expenses</th>
                <th className="py-3.5 px-5 text-right">Net Profit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {monthly.map((m) => (
                <tr key={m.monthKey} className="hover:bg-slate-50/70">
                  <td className="py-3.5 px-5 font-semibold text-[#0F172A]">{m.label}</td>
                  <td className="py-3.5 px-4 text-right font-mono-tabular text-[#0F172A]">
                    {formatCurrency(m.sales)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono-tabular text-red-600">
                    {formatCurrency(m.expenses)}
                  </td>
                  <td
                    className={`py-3.5 px-5 text-right font-mono-tabular font-semibold ${
                      m.profit >= 0 ? 'text-emerald-600' : 'text-red-600'
                    }`}
                  >
                    {formatCurrency(m.profit)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Expense Ledger */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-display text-lg font-bold text-[#0F172A]">Expense Ledger</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-xs font-semibold text-slate-500">
                <th className="py-3.5 px-5">Date</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Description</th>
                <th className="py-3.5 px-5 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {expenses.map((exp) => (
                <tr key={exp.id} className="hover:bg-slate-50/70">
                  <td className="py-3.5 px-5 font-mono-tabular text-xs text-slate-600">
                    {exp.date}
                  </td>
                  <td className="py-3.5 px-4 font-medium text-[#0F172A]">{exp.category}</td>
                  <td className="py-3.5 px-4 text-slate-600">{exp.description}</td>
                  <td className="py-3.5 px-5 text-right font-mono-tabular font-semibold text-[#0F172A]">
                    {formatCurrency(exp.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {expenseModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-exp-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs"
        >
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 id="add-exp-title" className="font-display text-lg font-bold text-[#0F172A]">
                Record Operating Expense
              </h2>
              <button
                type="button"
                onClick={() => setExpenseModalOpen(false)}
                aria-label="Close modal"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="p-6 space-y-4">
              {error && (
                <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-2.5 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="exp-date" className="block text-xs font-semibold text-slate-700">
                    Date
                  </label>
                  <input
                    id="exp-date"
                    type="date"
                    value={expDate}
                    onChange={(e) => setExpDate(e.target.value)}
                    className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-[#0F172A]"
                  />
                </div>
                <div>
                  <label htmlFor="exp-cat" className="block text-xs font-semibold text-slate-700">
                    Category
                  </label>
                  <select
                    id="exp-cat"
                    value={expCategory}
                    onChange={(e) => setExpCategory(e.target.value as Expense['category'])}
                    className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-[#0F172A]"
                  >
                    <option value="Ingredients">Ingredients</option>
                    <option value="Utilities">Utilities</option>
                    <option value="Payroll">Payroll</option>
                    <option value="Rent">Rent</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Equipment">Equipment</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="exp-desc" className="block text-xs font-semibold text-slate-700">
                  Description
                </label>
                <input
                  id="exp-desc"
                  type="text"
                  required
                  value={expDesc}
                  onChange={(e) => setExpDesc(e.target.value)}
                  placeholder="e.g., Weekly Market Produce"
                  className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-[#0F172A]"
                />
              </div>

              <div>
                <label htmlFor="exp-amount" className="block text-xs font-semibold text-slate-700">
                  Amount (₱)
                </label>
                <input
                  id="exp-amount"
                  type="number"
                  min={1}
                  required
                  value={expAmount}
                  onChange={(e) => setExpAmount(e.target.value)}
                  placeholder="1500"
                  className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-[#0F172A]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setExpenseModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 cursor-pointer"
                >
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
