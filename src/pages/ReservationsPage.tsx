import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { api, extractErrorMessage } from '../api/client';
import type { Reservation, ReservationStatus } from '../types';

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [modalOpen, setModalOpen] = useState(false);

  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [partySize, setPartySize] = useState(4);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState('18:30');
  const [tableNumber, setTableNumber] = useState('T-05');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const loadReservations = useCallback(async () => {
    try {
      const res = await api.get<{ data: Reservation[] }>('/reservations');
      setReservations(res.data.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReservations();
  }, [loadReservations]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!customerName.trim()) {
      setError('Guest name is required.');
      return;
    }
    try {
      await api.post('/reservations', {
        customerName: customerName.trim(),
        phone: phone.trim(),
        partySize,
        date,
        time,
        tableNumber,
        notes,
      });
      setCustomerName('');
      setPhone('');
      setNotes('');
      setModalOpen(false);
      loadReservations();
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to create reservation.'));
    }
  };

  const handleStatusChange = async (id: number, status: ReservationStatus) => {
    try {
      await api.patch(`/reservations/${id}`, { status });
      setReservations((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status } : r))
      );
    } catch {
      // ignore
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/reservations/${id}`);
      setReservations((prev) => prev.filter((r) => r.id !== id));
    } catch {
      // ignore
    }
  };

  const filtered = reservations.filter((r) =>
    statusFilter === 'All' ? true : r.status === statusFilter
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#0F172A]">Reservations</h1>
          <p className="mt-1 text-sm text-slate-600">
            Manage table bookings, party sizes, and seating schedules
          </p>
        </div>

        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Reservation</span>
        </button>
      </div>

      <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl w-fit">
        {['All', 'Confirmed', 'Seated', 'Completed', 'Cancelled'].map((st) => (
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

      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-xs font-semibold text-slate-500">
                <th className="py-3.5 px-5">Code</th>
                <th className="py-3.5 px-4">Guest Name</th>
                <th className="py-3.5 px-4">Date &amp; Time</th>
                <th className="py-3.5 px-4">Party</th>
                <th className="py-3.5 px-4">Table</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Notes</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400">
                    Loading reservations...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-500">
                    No reservations found.
                  </td>
                </tr>
              ) : (
                filtered.map((res) => (
                  <tr key={res.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-5 font-mono-tabular font-semibold text-[#0F172A]">
                      {res.reservationCode}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-[#0F172A]">{res.customerName}</div>
                      <div className="text-xs text-slate-500 font-mono-tabular">{res.phone}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono-tabular text-xs text-slate-600">
                      {res.date} &middot; {res.time}
                    </td>
                    <td className="py-3.5 px-4 font-mono-tabular text-slate-700">
                      {res.partySize} guests
                    </td>
                    <td className="py-3.5 px-4 font-mono-tabular font-semibold text-[#0F172A]">
                      {res.tableNumber}
                    </td>
                    <td className="py-3.5 px-4">
                      <select
                        aria-label={`Status for ${res.reservationCode}`}
                        value={res.status}
                        onChange={(e) =>
                          handleStatusChange(res.id, e.target.value as ReservationStatus)
                        }
                        className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-[#0F172A]"
                      >
                        <option value="Confirmed">Confirmed</option>
                        <option value="Seated">Seated</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-500 max-w-xs truncate">
                      {res.notes || '—'}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <button
                        type="button"
                        onClick={() => handleDelete(res.id)}
                        aria-label={`Delete ${res.reservationCode}`}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
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

      {modalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="new-res-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs"
        >
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 id="new-res-title" className="font-display text-lg font-bold text-[#0F172A]">
                New Table Reservation
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
                <label htmlFor="res-guest" className="block text-xs font-semibold text-slate-700">
                  Guest Name
                </label>
                <input
                  id="res-guest"
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Maria Clara Santos"
                  className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-[#0F172A] focus:bg-white focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="res-phone" className="block text-xs font-semibold text-slate-700">
                    Phone
                  </label>
                  <input
                    id="res-phone"
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0917-555-0199"
                    className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-[#0F172A] focus:bg-white focus:border-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="res-party" className="block text-xs font-semibold text-slate-700">
                    Party Size
                  </label>
                  <input
                    id="res-party"
                    type="number"
                    min={1}
                    max={30}
                    value={partySize}
                    onChange={(e) => setPartySize(Number(e.target.value))}
                    className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-[#0F172A] focus:bg-white focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label htmlFor="res-date" className="block text-xs font-semibold text-slate-700">
                    Date
                  </label>
                  <input
                    id="res-date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-[#0F172A]"
                  />
                </div>
                <div>
                  <label htmlFor="res-time" className="block text-xs font-semibold text-slate-700">
                    Time
                  </label>
                  <input
                    id="res-time"
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-[#0F172A]"
                  />
                </div>
                <div>
                  <label htmlFor="res-table" className="block text-xs font-semibold text-slate-700">
                    Table
                  </label>
                  <input
                    id="res-table"
                    type="text"
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-[#0F172A]"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="res-notes" className="block text-xs font-semibold text-slate-700">
                  Special Notes
                </label>
                <input
                  id="res-notes"
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional seating or celebration notes"
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
                  Save Reservation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
