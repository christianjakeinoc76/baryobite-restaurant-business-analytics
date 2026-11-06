import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Search, Trash2 } from 'lucide-react';
import { api } from '../api/client';
import { formatCurrency } from '../utils/analytics';
import { OrderStatusText } from '../components/StatusText';
import NewOrderModal from '../components/NewOrderModal';
import type { Order, OrderStatus } from '../types';

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [modalOpen, setModalOpen] = useState(false);

  const loadOrders = useCallback(async () => {
    try {
      const res = await api.get<{ data: Order[] }>('/orders');
      setOrders(res.data.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleStatusChange = async (orderId: number, newStatus: OrderStatus) => {
    try {
      await api.patch(`/orders/${orderId}`, { status: newStatus });
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
    } catch {
      // ignore
    }
  };

  const handleDelete = async (orderId: number) => {
    try {
      await api.delete(`/orders/${orderId}`);
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
    } catch {
      // ignore
    }
  };

  const filtered = orders.filter((o) => {
    const matchesStatus = statusFilter === 'All' || o.status === statusFilter;
    const matchesType = typeFilter === 'All' || o.orderType === typeFilter;
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      o.orderCode.toLowerCase().includes(q) ||
      o.customerName.toLowerCase().includes(q);
    return matchesStatus && matchesType && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#0F172A]">Orders</h1>
          <p className="mt-1 text-sm text-slate-600">
            Manage dine-in, takeout, and delivery orders in real time
          </p>
        </div>

        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Order</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by Order ID or customer..."
            aria-label="Filter orders"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2 text-sm text-[#0F172A] focus:bg-white focus:border-blue-600 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
            {['All', 'Completed', 'Preparing', 'Pending', 'Cancelled'].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                  statusFilter === st
                    ? 'bg-white text-[#0F172A] shadow-2xs'
                    : 'text-slate-600 hover:text-[#0F172A]'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <select
            aria-label="Filter by order type"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-[#0F172A] focus:bg-white focus:border-blue-600 focus:outline-none"
          >
            <option value="All">All Order Types</option>
            <option value="Dine-In">Dine-In</option>
            <option value="Takeout">Takeout</option>
            <option value="Delivery">Delivery</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-xs font-semibold text-slate-500">
                <th className="py-3.5 px-5">Order ID</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Items</th>
                <th className="py-3.5 px-4">Order Type</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Total Amount</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400">
                    Loading orders...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-500">
                    No orders found.
                  </td>
                </tr>
              ) : (
                filtered.map((order) => (
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
                    <td className="py-3.5 px-4 text-xs text-slate-600 max-w-xs truncate">
                      {order.items.map((i) => `${i.quantity}x ${i.name}`).join(', ') || '—'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                      {order.orderType}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <OrderStatusText status={order.status} />
                        <select
                          aria-label={`Change status for ${order.orderCode}`}
                          value={order.status}
                          onChange={(e) =>
                            handleStatusChange(order.id, e.target.value as OrderStatus)
                          }
                          className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-700 focus:bg-white focus:border-blue-600 focus:outline-none"
                        >
                          <option value="Pending">Pending</option>
                          <option value="Preparing">Preparing</option>
                          <option value="Completed">Completed</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono-tabular font-semibold text-[#0F172A] whitespace-nowrap">
                      {formatCurrency(order.totalAmount)}
                    </td>
                    <td className="py-3.5 px-5 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleDelete(order.id)}
                        aria-label={`Delete ${order.orderCode}`}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <NewOrderModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={loadOrders}
      />
    </div>
  );
}
