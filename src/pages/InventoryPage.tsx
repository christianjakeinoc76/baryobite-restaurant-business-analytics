import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Trash2, X, PackagePlus } from 'lucide-react';
import { api, extractErrorMessage } from '../api/client';
import { formatCurrency } from '../utils/analytics';
import { StockStatusText } from '../components/StatusText';
import type { InventoryItem } from '../types';

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [onlyLowStock, setOnlyLowStock] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const [name, setName] = useState('');
  const [category, setCategory] = useState<InventoryItem['category']>('Produce');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('kg');
  const [reorderLevel, setReorderLevel] = useState('10');
  const [unitCost, setUnitCost] = useState('');
  const [supplier, setSupplier] = useState('');
  const [error, setError] = useState('');

  const loadInventory = useCallback(async () => {
    try {
      const res = await api.get<{ data: InventoryItem[] }>('/inventory');
      setItems(res.data.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  const handleRestock = async (item: InventoryItem, delta = 10) => {
    const updatedQty = item.quantity + delta;
    try {
      await api.patch(`/inventory/${item.id}`, { quantity: updatedQty });
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, quantity: updatedQty } : i))
      );
    } catch {
      // ignore
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim() || quantity === '') {
      setError('Ingredient name and quantity are required.');
      return;
    }
    try {
      await api.post('/inventory', {
        name: name.trim(),
        category,
        quantity: Number(quantity),
        unit: unit.trim() || 'kg',
        reorderLevel: Number(reorderLevel) || 5,
        unitCost: Number(unitCost) || 100,
        supplier: supplier.trim() || 'Local Supplier',
      });
      setName('');
      setQuantity('');
      setUnitCost('');
      setSupplier('');
      setModalOpen(false);
      loadInventory();
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to add inventory item.'));
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/inventory/${id}`);
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch {
      // ignore
    }
  };

  const lowStockCount = items.filter((i) => i.quantity <= i.reorderLevel).length;
  const filtered = items.filter((i) =>
    onlyLowStock ? i.quantity <= i.reorderLevel : true
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#0F172A]">Inventory</h1>
          <p className="mt-1 text-sm text-slate-600">
            Track kitchen ingredients, reorder thresholds, and supplier stock
          </p>
        </div>

        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Ingredient</span>
        </button>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
          <button
            type="button"
            onClick={() => setOnlyLowStock(false)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
              !onlyLowStock
                ? 'bg-white text-[#0F172A] shadow-2xs'
                : 'text-slate-600 hover:text-[#0F172A]'
            }`}
          >
            All Items ({items.length})
          </button>
          <button
            type="button"
            onClick={() => setOnlyLowStock(true)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
              onlyLowStock
                ? 'bg-white text-red-700 shadow-2xs'
                : 'text-slate-600 hover:text-[#0F172A]'
            }`}
          >
            Low Stock Alerts ({lowStockCount})
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-xs font-semibold text-slate-500">
                <th className="py-3.5 px-5">Ingredient</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4 text-right">Stock Level</th>
                <th className="py-3.5 px-4 text-right">Reorder At</th>
                <th className="py-3.5 px-4 text-right">Unit Cost</th>
                <th className="py-3.5 px-4">Supplier</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400">
                    Loading inventory...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-500">
                    No inventory items found.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-5 font-semibold text-[#0F172A]">{item.name}</td>
                    <td className="py-3.5 px-4 text-slate-600">{item.category}</td>
                    <td className="py-3.5 px-4 text-right font-mono-tabular font-semibold text-[#0F172A]">
                      {item.quantity} {item.unit}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono-tabular text-slate-500">
                      {item.reorderLevel} {item.unit}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono-tabular text-slate-700">
                      {formatCurrency(item.unitCost)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{item.supplier}</td>
                    <td className="py-3.5 px-4">
                      <StockStatusText
                        quantity={item.quantity}
                        reorderLevel={item.reorderLevel}
                      />
                    </td>
                    <td className="py-3.5 px-5 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleRestock(item, 10)}
                          className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100 cursor-pointer"
                        >
                          <PackagePlus className="w-3.5 h-3.5" />
                          <span>+10</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          aria-label={`Delete ${item.name}`}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-inv-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs"
        >
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 id="add-inv-title" className="font-display text-lg font-bold text-[#0F172A]">
                Add Inventory Ingredient
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
                <label htmlFor="inv-name" className="block text-xs font-semibold text-slate-700">
                  Ingredient Name
                </label>
                <input
                  id="inv-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Red Onions"
                  className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-[#0F172A]"
                />
              </div>

              <div>
                <label htmlFor="inv-category" className="block text-xs font-semibold text-slate-700">
                  Category
                </label>
                <select
                  id="inv-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as InventoryItem['category'])}
                  className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-[#0F172A]"
                >
                  <option value="Meat & Poultry">Meat &amp; Poultry</option>
                  <option value="Seafood">Seafood</option>
                  <option value="Produce">Produce</option>
                  <option value="Dry Goods">Dry Goods</option>
                  <option value="Beverages">Beverages</option>
                  <option value="Dairy & Condiments">Dairy &amp; Condiments</option>
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label htmlFor="inv-qty" className="block text-xs font-semibold text-slate-700">
                    Quantity
                  </label>
                  <input
                    id="inv-qty"
                    type="number"
                    min={0}
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="15"
                    className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-[#0F172A]"
                  />
                </div>
                <div>
                  <label htmlFor="inv-unit" className="block text-xs font-semibold text-slate-700">
                    Unit
                  </label>
                  <input
                    id="inv-unit"
                    type="text"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="kg"
                    className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-[#0F172A]"
                  />
                </div>
                <div>
                  <label htmlFor="inv-reorder" className="block text-xs font-semibold text-slate-700">
                    Reorder At
                  </label>
                  <input
                    id="inv-reorder"
                    type="number"
                    min={0}
                    value={reorderLevel}
                    onChange={(e) => setReorderLevel(e.target.value)}
                    className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-[#0F172A]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="inv-cost" className="block text-xs font-semibold text-slate-700">
                    Unit Cost (₱)
                  </label>
                  <input
                    id="inv-cost"
                    type="number"
                    min={0}
                    value={unitCost}
                    onChange={(e) => setUnitCost(e.target.value)}
                    placeholder="120"
                    className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-[#0F172A]"
                  />
                </div>
                <div>
                  <label htmlFor="inv-supplier" className="block text-xs font-semibold text-slate-700">
                    Supplier
                  </label>
                  <input
                    id="inv-supplier"
                    type="text"
                    value={supplier}
                    onChange={(e) => setSupplier(e.target.value)}
                    placeholder="Tagaytay Fresh"
                    className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-[#0F172A]"
                  />
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
                  Save Ingredient
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
