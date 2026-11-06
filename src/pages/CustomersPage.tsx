import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Search, Trash2, X } from 'lucide-react';
import { api, extractErrorMessage } from '../api/client';
import { formatCurrency } from '../utils/analytics';
import type { Customer, Order } from '../types';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loyaltyTier, setLoyaltyTier] = useState<Customer['loyaltyTier']>('Bronze');
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    try {
      const [custRes, ordRes] = await Promise.all([
        api.get<{ data: Customer[] }>('/customers'),
        api.get<{ data: Order[] }>('/orders'),
      ]);
      setCustomers(custRes.data.data);
      setOrders(ordRes.data.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim() || !email.trim()) {
      setError('Customer name and email are required.');
      return;
    }
    try {
      await api.post('/customers', {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        loyaltyTier,
      });
      setName('');
      setEmail('');
      setPhone('');
      setModalOpen(false);
      loadData();
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to add customer.'));
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/customers/${id}`);
      setCustomers((prev) => prev.filter((c) => c.id !== id));
    } catch {
      // ignore
    }
  };

  const filtered = customers.filter((c) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.phone.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#0F172A]">Customers</h1>
          <p className="mt-1 text-sm text-slate-600">
            View diner profiles, loyalty tiers, order frequency, and lifetime spend
          </p>
        </div>

        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Customer</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/90 p-4">
        <div className="relative max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customers by name, email, or phone..."
            aria-label="Search customers"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2 text-sm text-[#0F172A] focus:bg-white focus:border-blue-600 focus:outline-none"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-xs font-semibold text-slate-500">
                <th className="py-3.5 px-5">Customer</th>
                <th className="py-3.5 px-4">Phone</th>
                <th className="py-3.5 px-4">Loyalty Tier</th>
                <th className="py-3.5 px-4">Joined</th>
                <th className="py-3.5 px-4 text-right">Orders</th>
                <th className="py-3.5 px-4 text-right">Total Spent</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    Loading customers...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-500">
                    No customers found.
                  </td>
                </tr>
              ) : (
                filtered.map((c) => {
                  const custOrders = orders.filter(
                    (o) =>
                      o.status !== 'Cancelled' &&
                      (o.customerId === c.id ||
                        o.customerName.toLowerCase() === c.name.toLowerCase())
                  );
                  const totalSpent = custOrders.reduce((s, o) => s + o.totalAmount, 0);

                  return (
                    <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-5">
                        <div className="font-semibold text-[#0F172A]">{c.name}</div>
                        <div className="text-xs text-slate-500">{c.email}</div>
                      </td>
                      <td className="py-3.5 px-4 font-mono-tabular text-xs text-slate-600">
                        {c.phone}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-[#0F172A]">
                        {c.loyaltyTier}
                      </td>
                      <td className="py-3.5 px-4 font-mono-tabular text-xs text-slate-500">
                        {c.joinedDate}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono-tabular text-slate-700">
                        {custOrders.length}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono-tabular font-semibold text-[#0F172A]">
                        {formatCurrency(totalSpent)}
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <button
                          type="button"
                          onClick={() => handleDelete(c.id)}
                          aria-label={`Delete ${c.name}`}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-cust-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs"
        >
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 id="add-cust-title" className="font-display text-lg font-bold text-[#0F172A]">
                Add Customer
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                aria-label="Close modal"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4">
              {error && (
                <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-2.5 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="cust-name" className="block text-xs font-semibold text-slate-700">
                  Full Name
                </label>
                <input
                  id="cust-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Elena Mendoza"
                  className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-[#0F172A]"
                />
              </div>

              <div>
                <label htmlFor="cust-email" className="block text-xs font-semibold text-slate-700">
                  Email Address
                </label>
                <input
                  id="cust-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="elena@example.com"
                  className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-[#0F172A]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="cust-phone" className="block text-xs font-semibold text-slate-700">
                    Phone
                  </label>
                  <input
                    id="cust-phone"
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0917-555-0144"
                    className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-[#0F172A]"
                  />
                </div>
                <div>
                  <label htmlFor="cust-tier" className="block text-xs font-semibold text-slate-700">
                    Loyalty Tier
                  </label>
                  <select
                    id="cust-tier"
                    value={loyaltyTier}
                    onChange={(e) => setLoyaltyTier(e.target.value as Customer['loyaltyTier'])}
                    className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-[#0F172A]"
                  >
                    <option value="Bronze">Bronze</option>
                    <option value="Silver">Silver</option>
                    <option value="Gold">Gold</option>
                    <option value="VIP">VIP</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 cursor-pointer"
                >
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
