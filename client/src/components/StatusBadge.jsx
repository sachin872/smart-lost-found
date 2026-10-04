import React from 'react';

export default function StatusBadge({ status, type = 'item' }) {
  const normalized = (status || '').toLowerCase();

  const getStyle = () => {
    switch (normalized) {
      case 'returned':
      case 'approved':
      case 'completed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'matched':
      case 'claimed':
      case 'pending':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'info_requested':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'rejected':
      case 'closed':
      case 'cancelled':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'reported':
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getLabel = () => {
    switch (normalized) {
      case 'info_requested':
        return 'Info Requested';
      default:
        return status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown';
    }
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStyle()}`}>
      {getLabel()}
    </span>
  );
}
