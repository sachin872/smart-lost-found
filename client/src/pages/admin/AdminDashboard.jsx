import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminService, matchService } from '../../services/api';
import {
  Users,
  PackageSearch,
  CheckSquare,
  Sparkles,
  ClipboardList,
  CheckCircle2,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  MapPin,
  Calendar,
  RefreshCw,
} from 'lucide-react';
import ScoreBadge from '../../components/ScoreBadge';
import StatusBadge from '../../components/StatusBadge';
import { CardSkeleton, TableSkeleton } from '../../components/SkeletonLoader';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await adminService.getDashboard();
      setData(res.data);
    } catch (err) {
      console.error('Failed to load admin stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleRunBatch = async () => {
    try {
      setRefreshing(true);
      await matchService.runBatch();
      await fetchDashboard();
    } catch (err) {
      console.error(err);
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
        <TableSkeleton rows={5} />
      </div>
    );
  }

  const stats = data?.stats || {};
  const recent = data?.recent || {};
  const charts = data?.charts || {};

  return (
    <div className="space-y-8 pb-12">
      {/* Title & Batch Trigger */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">System Overview & Analytics</h1>
          <p className="text-xs text-slate-500">Live operational telemetry across campus security nodes.</p>
        </div>

        <button
          onClick={handleRunBatch}
          disabled={refreshing}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition flex items-center gap-2 self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Run Global AI Matching Engine
        </button>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Registered Users</span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-3xl font-black text-slate-900">{stats.totalUsers || 0}</p>
          <p className="text-[11px] text-slate-400">Students, Finders & Admins</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Total Lost Items</span>
            <PackageSearch className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-3xl font-black text-slate-900">{stats.totalLost || 0}</p>
          <p className="text-[11px] text-slate-400">Pending recovery</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Total Found Items</span>
            <CheckSquare className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-3xl font-black text-slate-900">{stats.totalFound || 0}</p>
          <p className="text-[11px] text-slate-400">In physical custody</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Potential Matches</span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-3xl font-black text-slate-900">{stats.potentialMatches || 0}</p>
          <p className="text-[11px] text-slate-400">Identified by AI engine</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Pending Claims</span>
            <ClipboardList className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-3xl font-black text-indigo-600">{stats.pendingClaims || 0}</p>
          <p className="text-[11px] text-slate-400">Requires verification</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Returned Items</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-3xl font-black text-emerald-600">{stats.totalReturned || 0}</p>
          <p className="text-[11px] text-slate-400">Verified via OTP</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Recovery Rate</span>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-3xl font-black text-blue-600">{stats.recoveryRate || 0}%</p>
          <p className="text-[11px] text-slate-400">Successfully restored</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Blocked Users</span>
            <ShieldAlert className="w-4 h-4 text-red-500" />
          </div>
          <p className="text-3xl font-black text-red-600">{stats.blockedUsers || 0}</p>
          <p className="text-[11px] text-slate-400">Spam moderation</p>
        </div>
      </div>

      {/* High Confidence Matches Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <h2 className="text-base font-black text-slate-900">High-Confidence Potential Matches</h2>
          </div>
          <Link to="/admin/claims" className="text-xs font-bold text-blue-600 hover:underline">
            Manage All Claims
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
              <tr>
                <th className="p-3 rounded-l-xl">Lost Item</th>
                <th className="p-3">Found Item</th>
                <th className="p-3">Score & Confidence</th>
                <th className="p-3">Location Proximity</th>
                <th className="p-3 rounded-r-xl">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recent.highConfidenceMatches?.map((m) => (
                <tr key={m._id} className="hover:bg-slate-50">
                  <td className="p-3 font-bold text-slate-800">{m.lostItemId?.title || 'Lost item'}</td>
                  <td className="p-3 text-slate-700">{m.foundItemId?.title || 'Found item'}</td>
                  <td className="p-3">
                    <ScoreBadge score={m.finalScore} confidenceLevel={m.confidenceLevel} size="sm" />
                  </td>
                  <td className="p-3 text-slate-500 truncate max-w-xs">{m.foundItemId?.foundLocation}</td>
                  <td className="p-3">
                    <Link
                      to={`/matches/${m._id}`}
                      className="px-3 py-1.5 bg-blue-50 text-blue-700 font-bold rounded-lg hover:bg-blue-100 transition inline-block"
                    >
                      Compare
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2-Column: Recent Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Lost Reports */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-3">
          <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
            <PackageSearch className="w-4 h-4 text-rose-500" />
            Recent Lost Reports
          </h2>
          <div className="divide-y divide-slate-100">
            {recent.recentLost?.map((item) => (
              <div key={item._id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-slate-800 line-clamp-1">{item.title}</p>
                  <p className="text-slate-400 text-[11px]">
                    By {item.userId?.name} • {item.lostLocation}
                  </p>
                </div>
                <StatusBadge status={item.status} />
              </div>
            ))}
          </div>
        </div>

        {/* Recent Found Reports */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-3">
          <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-emerald-500" />
            Recent Found Inventory
          </h2>
          <div className="divide-y divide-slate-100">
            {recent.recentFound?.map((item) => (
              <div key={item._id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-slate-800 line-clamp-1">{item.title}</p>
                  <p className="text-slate-400 text-[11px]">
                    By {item.finderId?.name} • Safe: {item.currentStorageLocation}
                  </p>
                </div>
                <StatusBadge status={item.status} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
