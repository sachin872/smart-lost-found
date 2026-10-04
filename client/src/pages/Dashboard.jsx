import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  lostService,
  foundService,
  matchService,
  claimService,
} from '../services/api';
import {
  PackageSearch,
  CheckSquare,
  Sparkles,
  ClipboardList,
  CheckCircle2,
  PlusCircle,
  ArrowRight,
  Clock,
  MapPin,
  ExternalLink,
} from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import ScoreBadge from '../components/ScoreBadge';
import { CardSkeleton } from '../components/SkeletonLoader';

export default function Dashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [myLost, setMyLost] = useState([]);
  const [myFound, setMyFound] = useState([]);
  const [matches, setMatches] = useState([]);
  const [claims, setClaims] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [lostRes, foundRes, matchRes, claimRes] = await Promise.all([
          lostService.getMy(),
          foundService.getMy(),
          matchService.getAll({ limit: 4 }),
          claimService.getAll({ limit: 4 }),
        ]);

        setMyLost(lostRes.data?.items || []);
        setMyFound(foundRes.data?.items || []);
        setMatches(matchRes.data?.matches || []);
        setClaims(claimRes.data?.claims || []);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const totalRecovered =
    myLost.filter((i) => i.status === 'returned').length +
    myFound.filter((i) => i.status === 'returned').length;

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-2">
          <span className="inline-block px-3 py-1 rounded-full bg-white/10 text-blue-200 text-xs font-semibold backdrop-blur-sm">
            AI Automated Recovery Desk
          </span>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Hello, {user?.name}! 👋
          </h1>
          <p className="text-sm text-blue-100 max-w-xl">
            Track your reports, view potential AI semantic matches, verify ownership claims, and schedule secure OTP handovers.
          </p>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap gap-3 shrink-0">
          <Link
            to="/report-lost"
            className="px-4 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5"
          >
            <PlusCircle className="w-4 h-4" />
            Report Lost
          </Link>
          <Link
            to="/report-found"
            className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            Report Found
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">My Lost</span>
            <PackageSearch className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-800">{myLost.length}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">My Found</span>
            <CheckSquare className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-800">{myFound.length}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">AI Matches</span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-800">{matches.length}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">My Claims</span>
            <ClipboardList className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-800">{claims.length}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-1 col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Recovered</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-emerald-600">{totalRecovered}</p>
        </div>
      </div>

      {/* AI Matches Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-100 text-amber-600">
              <Sparkles className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-black text-slate-900">Potential AI Matches</h2>
          </div>
          <Link
            to="/matches"
            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            View All ({matches.length}) <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : matches.length === 0 ? (
          <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center space-y-2">
            <Sparkles className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-700">No Potential Matches Yet</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Our automated engine continuously evaluates newly submitted lost and found reports. You will receive an instant notification when a high-confidence match is detected.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {matches.slice(0, 2).map((match) => (
              <div
                key={match._id}
                className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:border-blue-400 transition space-y-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 line-clamp-1">
                      {match.foundItemId?.title || 'Found Item'}
                    </h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {match.foundItemId?.foundLocation || 'Campus'}
                    </p>
                  </div>
                  <ScoreBadge score={match.finalScore} confidenceLevel={match.confidenceLevel} size="sm" />
                </div>

                <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-600 border border-slate-100 italic">
                  "{match.matchReason}"
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <div className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Matched {new Date(match.createdAt).toLocaleDateString()}
                  </div>
                  <Link
                    to={`/matches/${match._id}`}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm transition"
                  >
                    View Match Comparison
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2-Column: My Lost vs My Found Quick Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* My Lost Items */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
              <PackageSearch className="w-4 h-4 text-rose-500" />
              My Lost Reports
            </h2>
            <Link to="/my-lost" className="text-xs font-bold text-blue-600 hover:underline">
              View All
            </Link>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm divide-y divide-slate-100">
            {myLost.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                You haven't reported any lost items.
              </div>
            ) : (
              myLost.slice(0, 3).map((item) => (
                <div key={item._id} className="p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <img
                      src={
                        item.imageUrls?.[0] ||
                        'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=200&q=80'
                      }
                      alt={item.title}
                      className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0"
                    />
                    <div className="overflow-hidden">
                      <p className="text-xs font-bold text-slate-800 truncate">{item.title}</p>
                      <p className="text-[11px] text-slate-400 truncate">{item.lostLocation}</p>
                    </div>
                  </div>
                  <div className="shrink-0 flex items-center gap-2">
                    <StatusBadge status={item.status} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* My Claims & Handovers */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-blue-500" />
              My Active Claims
            </h2>
            <Link to="/claims" className="text-xs font-bold text-blue-600 hover:underline">
              View All
            </Link>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm divide-y divide-slate-100">
            {claims.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                You haven't filed any ownership claims yet.
              </div>
            ) : (
              claims.slice(0, 3).map((claim) => (
                <div key={claim._id} className="p-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold text-slate-800">
                      {claim.foundItemId?.title || 'Claimed Item'}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Verification Score: <strong className="text-blue-600">{claim.verificationScore}%</strong>
                    </p>
                  </div>
                  <div className="shrink-0">
                    <StatusBadge status={claim.verificationStatus} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
