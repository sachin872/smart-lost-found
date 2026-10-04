import React from 'react';

export default function ScoreBadge({ score, confidenceLevel, size = 'md', showBar = false }) {
  const getColors = () => {
    if (score >= 85 || confidenceLevel === 'HIGH CONFIDENCE') {
      return {
        bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        badge: 'bg-emerald-500',
        ring: 'ring-emerald-500/20',
        bar: 'bg-emerald-500',
      };
    }
    if (score >= 65 || confidenceLevel === 'MEDIUM CONFIDENCE') {
      return {
        bg: 'bg-amber-50 text-amber-700 border-amber-200',
        badge: 'bg-amber-500',
        ring: 'ring-amber-500/20',
        bar: 'bg-amber-500',
      };
    }
    return {
      bg: 'bg-slate-100 text-slate-700 border-slate-200',
      badge: 'bg-slate-400',
      ring: 'ring-slate-400/20',
      bar: 'bg-slate-400',
    };
  };

  const colors = getColors();

  if (size === 'sm') {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${colors.bg}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${colors.badge}`} />
        {score}% {confidenceLevel || ''}
      </span>
    );
  }

  if (size === 'lg') {
    return (
      <div className="flex flex-col items-center">
        <div className={`relative flex items-center justify-center w-20 h-20 rounded-full border-4 ${colors.bg} font-black text-2xl`}>
          {score}%
        </div>
        <span className="mt-2 text-xs font-bold tracking-wider uppercase text-slate-600">
          {confidenceLevel || (score >= 85 ? 'HIGH CONFIDENCE' : score >= 65 ? 'MEDIUM CONFIDENCE' : 'LOW CONFIDENCE')}
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1 w-full">
      <div className="flex items-center justify-between">
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${colors.bg}`}>
          <span className={`w-2 h-2 rounded-full ${colors.badge}`} />
          {confidenceLevel || (score >= 85 ? 'HIGH CONFIDENCE' : score >= 65 ? 'MEDIUM CONFIDENCE' : 'LOW CONFIDENCE')}
        </span>
        <span className="text-sm font-black text-slate-800">{score}% Match</span>
      </div>
      {showBar && (
        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-1">
          <div
            className={`h-full rounded-full transition-all duration-500 ${colors.bar}`}
            style={{ width: `${Math.min(100, Math.max(5, score))}%` }}
          />
        </div>
      )}
    </div>
  );
}
