import React, { useEffect, useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { api, extractErrorMessage } from '../api/client';
import { formatCurrency } from '../utils/analytics';
import type { Customer, MenuItem, OrderType, OrderStatus } from '../types';

interface NewOrderModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export default function NewOrderModal({ open, onClose, onCreated }: NewOrderModalProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [customerId, setCustomerId] = useState<number>(0);
  const [orderType, setOrderType] = useState<OrderType>('Dine-In');
  const [status, setStatus] = useState<OrderStatus>('Completed');
  const [selectedLines, setSelectedLines] = useState<
    { menuItemId: number; name: string; quantity: number; unitPrice: number; unitCost: number }[]
  >([]);
  const [selectedMenuId, setSelectedMenuId] = useState<number>(0);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError('');
    Promise.all([
      api.get<{ data: Customer[] }>('/customers'),
      api.get<{ data: MenuItem[] }>('/menu'),
    ])
      .then(([custRes, menuRes]) => {
        const custList = custRes.data.data;
        const availMenu = menuRes.data.data.filter((m) => m.available);
        setCustomers(custList);
        setMenuItems(availMenu);
        if (custList.length > 0) setCustomerId(custList[0].id);
        if (availMenu.length > 0) {
          setSelectedMenuId(availMenu[0].id);
          setSelectedLines([
            {
              menuItemId: availMenu[0].id,
              name: availMenu[0].name,
              quantity: 1,
              unitPrice: availMenu[0].price,
              unitCost: availMenu[0].cost,
            },
          ]);
        }
      })
      .catch(() => {
        setError('Failed to load customers and menu items.');
      });
  }, [open]);

  if (!open) return null;

  const handleAddLine = () => {
    const item = menuItems.find((m) => m.id === Number(selectedMenuId));
    if (!item) return;
    setSelectedLines((prev) => {
      const existing = prev.find((l) => l.menuItemId === item.id);
      if (existing) {
        return prev.map((l) =>
          l.menuItemId === item.id ? { ...l, quantity: l.quantity + 1 } : l
        );
      }
      return [
        ...prev,
        {
          menuItemId: item.id,
          name: item.name,
          quantity: 1,
          unitPrice: item.price,
          unitCost: item.cost,
        },
      ];
    });
  };

  const handleQtyChange = (menuItemId: number, qty: number) => {
    if (qty < 1) return;
    setSelectedLines((prev) =>
      prev.map((l) => (l.menuItemId === menuItemId ? { ...l, quantity: qty } : l))
    );
  };

  const handleRemoveLine = (menuItemId: number) => {
    setSelectedLines((prev) => prev.filter((l) => l.menuItemId !== menuItemId));
  };

  const totalAmount = selectedLines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (selectedLines.length === 0) {
      setError('Please add at least one menu item.');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/orders', {
        customerId,
        orderType,
        status,
        items: selectedLines,
      });
      onCreated();
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to create order.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-order-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs"
    >
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 id="new-order-modal-title" className="font-display text-lg font-bold text-[#0F172A]">
            Create New Order
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-2.5 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="order-customer" className="block text-xs font-semibold text-slate-700">
                Customer
              </label>
              <select
                id="order-customer"
                value={customerId}
                onChange={(e) => setCustomerId(Number(e.target.value))}
                className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-[#0F172A] focus:bg-white focus:border-blue-600 focus:outline-none"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="order-type" className="block text-xs font-semibold text-slate-700">
                Order Type
              </label>
              <select
                id="order-type"
                value={orderType}
                onChange={(e) => setOrderType(e.target.value as OrderType)}
                className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-[#0F172A] focus:bg-white focus:border-blue-600 focus:outline-none"
              >
                <option value="Dine-In">Dine-In</option>
                <option value="Takeout">Takeout</option>
                <option value="Delivery">Delivery</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="order-status" className="block text-xs font-semibold text-slate-700">
              Order Status
            </label>
            <select
              id="order-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as OrderStatus)}
              className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-[#0F172A] focus:bg-white focus:border-blue-600 focus:outline-none"
            >
              <option value="Completed">Completed</option>
              <option value="Preparing">Preparing</option>
              <option value="Pending">Pending</option>
            </select>
          </div>

          <div>
            <label htmlFor="order-add-dish" className="block text-xs font-semibold text-slate-700">
              Add Menu Item
            </label>
            <div className="mt-1.5 flex gap-2">
              <select
                id="order-add-dish"
                value={selectedMenuId}
                onChange={(e) => setSelectedMenuId(Number(e.target.value))}
                className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-[#0F172A] focus:bg-white focus:border-blue-600 focus:outline-none"
              >
                {menuItems.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({formatCurrency(m.price)})
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleAddLine}
                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-800 cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Add</span>
              </button>
            </div>
          </div>

          <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 max-h-48 overflow-y-auto">
            {selectedLines.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500">
                No items added yet. Select a dish above.
              </div>
            ) : (
              selectedLines.map((line) => (
                <div key={line.menuItemId} className="flex items-center justify-between px-3.5 py-2.5 text-sm">
                  <div className="min-w-0 flex-1 pr-2">
                    <div className="font-medium text-[#0F172A] truncate">{line.name}</div>
                    <div className="text-xs text-slate-500 font-mono-tabular">
                      {formatCurrency(line.unitPrice)} each
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <input
                      type="number"
                      min={1}
                      aria-label={`Quantity for ${line.name}`}
                      value={line.quantity}
                      onChange={(e) => handleQtyChange(line.menuItemId, Number(e.target.value))}
                      className="w-16 rounded-lg border border-slate-200 px-2 py-1 text-center text-xs font-mono-tabular"
                    />
                    <span className="w-20 text-right font-semibold font-mono-tabular text-xs text-[#0F172A]">
                      {formatCurrency(line.unitPrice * line.quantity)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveLine(line.menuItemId)}
                      aria-label={`Remove ${line.name}`}
                      className="p-1 text-slate-400 hover:text-red-600 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <span className="text-sm font-medium text-slate-600">Total Amount</span>
            <span className="font-display text-lg font-bold font-mono-tabular text-[#0F172A]">
              {formatCurrency(totalAmount)}
            </span>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 cursor-pointer"
            >
              {submitting ? 'Saving...' : 'Place Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
