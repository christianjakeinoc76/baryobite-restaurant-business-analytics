import React from 'react';
import { CheckCircle2, Clock, Flame, XCircle, AlertTriangle } from 'lucide-react';

export function OrderStatusText({ status }: { status: string }) {
  switch (status) {
    case 'Completed':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>Completed</span>
        </span>
      );
    case 'Preparing':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700">
          <Flame className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <span>Preparing</span>
        </span>
      );
    case 'Pending':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700">
          <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span>Pending</span>
        </span>
      );
    case 'Cancelled':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-700">
          <XCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />
          <span>Cancelled</span>
        </span>
      );
    default:
      return <span className="text-xs font-medium text-slate-600">{status}</span>;
  }
}

export function StockStatusText({ quantity, reorderLevel }: { quantity: number; reorderLevel: number }) {
  if (quantity <= reorderLevel) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-700">
        <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0" />
        <span>Low Stock</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
      <span>In Stock</span>
    </span>
  );
}
