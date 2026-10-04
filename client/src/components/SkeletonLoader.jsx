import React from 'react';

export function CardSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm animate-pulse space-y-4">
      <div className="w-full h-44 bg-slate-200 rounded-xl" />
      <div className="space-y-2">
        <div className="h-5 bg-slate-200 rounded-md w-3/4" />
        <div className="h-4 bg-slate-100 rounded-md w-1/2" />
      </div>
      <div className="pt-2 flex justify-between items-center border-t border-slate-100">
        <div className="h-4 bg-slate-200 rounded w-1/3" />
        <div className="h-7 bg-slate-200 rounded-lg w-1/4" />
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5 }) {
  return (
    <div className="w-full bg-white rounded-2xl border border-slate-200 overflow-hidden animate-pulse">
      <div className="h-12 bg-slate-100 border-b border-slate-200" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center px-6 py-4 border-b border-slate-100 gap-4">
          <div className="w-10 h-10 bg-slate-200 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-slate-200 rounded w-1/3" />
            <div className="h-3 bg-slate-100 rounded w-1/4" />
          </div>
          <div className="w-20 h-6 bg-slate-200 rounded-full" />
        </div>
      ))}
    </div>
  );
}
