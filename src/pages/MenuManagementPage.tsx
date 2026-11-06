import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { api, extractErrorMessage } from '../api/client';
import { formatCurrency } from '../utils/analytics';
import type { MenuCategory, MenuItem } from '../types';

export default function MenuManagementPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [modalOpen, setModalOpen] = useState(false);

  const [name, setName] = useState('');
  const [category, setCategory] = useState<MenuCategory>('Main Course');
  const [price, setPrice] = useState('');
  const [cost, setCost] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const loadMenu = useCallback(async () => {
    try {
      const res = await api.get<{ data: MenuItem[] }>('/menu');
      setItems(res.data.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMenu();
  }, [loadMenu]);

  const handleToggleAvailable = async (item: MenuItem) => {
    try {
      await api.patch(`/menu/${item.id}`, { available: !item.available });
      setItems((prev) =>
        prev.map((m) => (m.id === item.id ? { ...m, available: !m.available } : m))
      );
    } catch {
      // ignore
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim() || !price) {
      setError('Dish name and selling price are required.');
      return;
    }
    try {
      await api.post('/menu', {
        name: name.trim(),
        category,
        price: Number(price),
        cost: Number(cost) || Math.round(Number(price) * 0.4),
        description: description.trim(),
      });
      setName('');
      setPrice('');
      setCost('');
      setDescription('');
      setModalOpen(false);
      loadMenu();
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to add menu item.'));
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/menu/${id}`);
      setItems((prev) => prev.filter((m) => m.id !== id));
    } catch {
      // ignore
    }
  };

  const filtered = items.filter((m) =>
    categoryFilter === 'All' ? true : m.category === categoryFilter
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#0F172A]">Menu Management</h1>
          <p className="mt-1 text-sm text-slate-600">
            Configure dishes, pricing, food cost margins, and availability
          </p>
        </div>

        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Menu Item</span>
        </button>
      </div>

      <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl w-fit flex-wrap">
        {['All', 'Main Course', 'Appetizer', 'Dessert', 'Beverage'].map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategoryFilter(cat)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
              categoryFilter === cat
                ? 'bg-white text-[#0F172A] shadow-2xs'
                : 'text-slate-600 hover:text-[#0F172A]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-xs font-semibold text-slate-500">
                <th className="py-3.5 px-5">Dish Name</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4 text-right">Price</th>
                <th className="py-3.5 px-4 text-right">Unit Cost</th>
                <th className="py-3.5 px-4 text-right">Margin</th>
                <th className="py-3.5 px-4 text-right">Units Sold</th>
                <th className="py-3.5 px-4">Availability</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400">
                    Loading menu...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-500">
                    No menu items in this category.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => {
                  const marginPct =
                    item.price > 0
                      ? Math.round(((item.price - item.cost) / item.price) * 100)
                      : 0;
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-5">
                        <div className="font-semibold text-[#0F172A]">{item.name}</div>
                        <div className="text-xs text-slate-500 max-w-md truncate">
                          {item.description}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">{item.category}</td>
                      <td className="py-3.5 px-4 text-right font-mono-tabular font-semibold text-[#0F172A]">
                        {formatCurrency(item.price)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono-tabular text-slate-600">
                        {formatCurrency(item.cost)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono-tabular font-semibold text-emerald-600">
                        {marginPct}%
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono-tabular text-slate-700">
                        {item.soldCount}
                      </td>
                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() => handleToggleAvailable(item)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                            item.available
                              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {item.available ? 'Available' : 'Sold Out'}
                        </button>
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          aria-label={`Delete ${item.name}`}
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
          aria-labelledby="add-dish-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs"
        >
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 id="add-dish-title" className="font-display text-lg font-bold text-[#0F172A]">
                Add Menu Item
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
                <label htmlFor="dish-name" className="block text-xs font-semibold text-slate-700">
                  Dish Name
                </label>
                <input
                  id="dish-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Pork Binagoongan"
                  className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-[#0F172A]"
                />
              </div>

              <div>
                <label htmlFor="dish-category" className="block text-xs font-semibold text-slate-700">
                  Category
                </label>
                <select
                  id="dish-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as MenuCategory)}
                  className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-[#0F172A]"
                >
                  <option value="Main Course">Main Course</option>
                  <option value="Appetizer">Appetizer</option>
                  <option value="Dessert">Dessert</option>
                  <option value="Beverage">Beverage</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="dish-price" className="block text-xs font-semibold text-slate-700">
                    Selling Price (₱)
                  </label>
                  <input
                    id="dish-price"
                    type="number"
                    min={1}
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="320"
                    className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-[#0F172A]"
                  />
                </div>
                <div>
                  <label htmlFor="dish-cost" className="block text-xs font-semibold text-slate-700">
                    Unit Cost (₱)
                  </label>
                  <input
                    id="dish-cost"
                    type="number"
                    min={0}
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                    placeholder="130"
                    className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-[#0F172A]"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="dish-desc" className="block text-xs font-semibold text-slate-700">
                  Description
                </label>
                <input
                  id="dish-desc"
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Short dish description"
                  className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-[#0F172A]"
                />
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
                  Save Dish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
