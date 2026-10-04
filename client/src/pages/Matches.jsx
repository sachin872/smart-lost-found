import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { matchService } from '../services/api';
import { Sparkles, MapPin, Calendar, ArrowRight, RefreshCw } from 'lucide-react';
import ScoreBadge from '../components/ScoreBadge';
import { CardSkeleton } from '../components/SkeletonLoader';

export default function Matches() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confidenceFilter, setConfidenceFilter] = useState('All');
  const [refreshing, setRefreshing] = useState(false);

  const fetchMatches = async () => {
    try {
      setLoading(true);
      const res = await matchService.getAll({
        confidence: confidenceFilter,
        limit: 20,
      });
      setMatches(res.data?.matches || []);
    } catch (err) {
      console.error('Failed to load matches:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, [confidenceFilter]);

  const handleRunBatch = async () => {
    try {
      setRefreshing(true);
      await matchService.runBatch();
      await fetchMatches();
    } catch (err) {
      console.error('Failed to trigger batch match:', err);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-indigo-600">
            <Sparkles className="w-5 h-5 animate-pulse" />
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Potential Matches Found</h1>
          </div>
          <p className="text-xs text-slate-500">
            Automated correlation between reported lost possessions and turned-in found items.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={confidenceFilter}
            onChange={(e) => setConfidenceFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
          >
            <option value="All">All Confidence Levels</option>
            <option value="HIGH CONFIDENCE">High Confidence (85%+)</option>
            <option value="MEDIUM CONFIDENCE">Medium Confidence (65-84%)</option>
            <option value="LOW CONFIDENCE">Low Confidence (&lt;65%)</option>
          </select>

          <button
            onClick={handleRunBatch}
            disabled={refreshing}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Re-evaluate
          </button>
        </div>
      </div>

      {/* Matches Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : matches.length === 0 ? (
        <div className="p-12 bg-white rounded-3xl border border-slate-200 text-center space-y-3">
          <Sparkles className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-700">No Potential Matches In This Category</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Try switching filter to 'All Confidence Levels' or submit additional lost/found reports.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {matches.map((m) => {
            const lost = m.lostItemId || {};
            const found = m.foundItemId || {};

            return (
              <div
                key={m._id}
                className="bg-white rounded-3xl border border-slate-200/80 shadow-sm hover:border-blue-400 hover:shadow-md transition p-6 space-y-5 flex flex-col justify-between"
              >
                <div>
                  {/* Top: Headline & Final Confidence */}
                  <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Candidate Pair
                      </span>
                      <h2 className="text-base font-black text-slate-900 line-clamp-1 mt-0.5">
                        {found.title || lost.title || 'Item Match'}
                      </h2>
                    </div>
                    <ScoreBadge score={m.finalScore} confidenceLevel={m.confidenceLevel} size="sm" />
                  </div>

                  {/* Subscores Breakdown Grid */}
                  <div className="grid grid-cols-4 gap-2 my-4 p-3 bg-slate-50/80 rounded-2xl border border-slate-100 text-center">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Text</p>
                      <p className="text-xs font-black text-slate-800">{m.textScore}%</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Image</p>
                      <p className="text-xs font-black text-slate-800">{m.imageScore}%</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Location</p>
                      <p className="text-xs font-black text-slate-800">{m.locationScore}%</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Time</p>
                      <p className="text-xs font-black text-slate-800">{m.timeScore}%</p>
                    </div>
                  </div>

                  {/* Summary Details */}
                  <div className="space-y-2 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>
                        Found near: <strong>{found.foundLocation || 'Campus Area'}</strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>
                        Found on:{' '}
                        <strong>
                          {found.foundDate ? new Date(found.foundDate).toLocaleDateString() : 'Recent'}
                        </strong>
                      </span>
                    </div>
                  </div>

                  {/* AI Reason callout */}
                  <p className="mt-3 text-xs text-slate-500 italic bg-blue-50/50 p-2.5 rounded-xl border border-blue-100/50">
                    "{m.matchReason}"
                  </p>
                </div>

                <div className="pt-2">
                  <Link
                    to={`/matches/${m._id}`}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition flex items-center justify-center gap-2"
                  >
                    View Match Comparison
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
