import React, { useState } from 'react';
import { useNotifications } from '../context/NotificationContext';
import {
  Bell,
  CheckCircle2,
  CheckCheck,
  Sparkles,
  ShieldCheck,
  KeyRound,
  AlertCircle,
  Inbox,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Notifications() {
  const { notifications, unreadCount, markAsRead, markAllRead } = useNotifications();
  const [filter, setFilter] = useState('all'); // 'all', 'unread', 'read'

  const filtered = notifications.filter((n) => {
    if (filter === 'unread') return !n.isRead;
    if (filter === 'read') return n.isRead;
    return true;
  });

  const getIcon = (type) => {
    switch (type) {
      case 'match_found':
        return <Sparkles className="w-5 h-5 text-amber-500" />;
      case 'claim_status':
        return <ShieldCheck className="w-5 h-5 text-blue-600" />;
      case 'handover_scheduled':
        return <KeyRound className="w-5 h-5 text-emerald-600" />;
      case 'item_returned':
        return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      default:
        return <Bell className="w-5 h-5 text-slate-500" />;
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Notification Center</h1>
            {unreadCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-red-500 text-white">
                {unreadCount} unread
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time status updates on automated matches, claim verifications, and pickup OTPs.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 self-start sm:self-auto"
          >
            <CheckCheck className="w-4 h-4 text-slate-500" />
            Mark All as Read
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        {['all', 'unread', 'read'].map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold capitalize transition ${
              filter === tab
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm divide-y divide-slate-100 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Inbox className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-700">No Notifications</p>
            <p className="text-xs text-slate-400">
              You're all caught up! New matches and claim updates will appear here.
            </p>
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item._id}
              className={`p-5 flex items-start gap-4 transition ${
                !item.isRead ? 'bg-blue-50/40 hover:bg-blue-50/70' : 'hover:bg-slate-50'
              }`}
            >
              <div className="p-2.5 rounded-2xl bg-white border border-slate-100 shadow-sm shrink-0">
                {getIcon(item.type)}
              </div>

              <div className="flex-1 space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-xs font-bold text-slate-900">{item.title}</h4>
                  <span className="text-[10px] text-slate-400 shrink-0">
                    {new Date(item.createdAt).toLocaleDateString()} at{' '}
                    {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed font-normal">{item.message}</p>

                <div className="pt-2 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {item.relatedMatchId && (
                      <Link
                        to={`/matches/${item.relatedMatchId}`}
                        className="text-xs font-bold text-blue-600 hover:underline"
                      >
                        View Match Details →
                      </Link>
                    )}
                    {item.type === 'handover_scheduled' && (
                      <Link
                        to="/claims"
                        className="text-xs font-bold text-emerald-600 hover:underline"
                      >
                        View Handover Details →
                      </Link>
                    )}
                  </div>

                  {!item.isRead && (
                    <button
                      onClick={() => markAsRead(item._id)}
                      className="text-[11px] font-semibold text-slate-500 hover:text-blue-600"
                    >
                      Mark as read
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
