import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import {
  LayoutDashboard,
  PlusCircle,
  CheckCircle2,
  PackageSearch,
  CheckSquare,
  Sparkles,
  ClipboardList,
  Bell,
  User,
  LogOut,
  Shield,
  Users,
  BarChart3,
  KeyRound,
} from 'lucide-react';

export default function Sidebar() {
  const { user, isAdmin, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItemClass = ({ isActive }) =>
    `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
      isActive
        ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
    }`;

  return (
    <aside className="w-64 bg-white border-r border-slate-200/80 min-h-[calc(100vh-4rem)] p-4 flex flex-col justify-between shrink-0">
      <div className="space-y-6">
        {/* User Card */}
        <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl flex items-center gap-3">
          {user?.profileImage ? (
            <img
              src={user.profileImage}
              alt={user.name}
              className="w-10 h-10 rounded-full object-cover border border-slate-200"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-black text-sm">
              {user?.name?.charAt(0) || 'U'}
            </div>
          )}
          <div className="overflow-hidden">
            <h4 className="text-xs font-bold text-slate-800 truncate">{user?.name}</h4>
            <p className="text-[11px] text-slate-500 capitalize">{user?.role} Account</p>
          </div>
        </div>

        {/* User Navigation Links */}
        <div className="space-y-1">
          <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            Main Navigation
          </p>

          <NavLink to="/dashboard" className={navItemClass}>
            <div className="flex items-center gap-3">
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </div>
          </NavLink>

          <NavLink to="/report-lost" className={navItemClass}>
            <div className="flex items-center gap-3">
              <PlusCircle className="w-4 h-4 text-rose-500" />
              <span>Report Lost</span>
            </div>
          </NavLink>

          <NavLink to="/report-found" className={navItemClass}>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Report Found</span>
            </div>
          </NavLink>

          <NavLink to="/my-lost" className={navItemClass}>
            <div className="flex items-center gap-3">
              <PackageSearch className="w-4 h-4" />
              <span>My Lost Items</span>
            </div>
          </NavLink>

          <NavLink to="/my-found" className={navItemClass}>
            <div className="flex items-center gap-3">
              <CheckSquare className="w-4 h-4" />
              <span>My Found Items</span>
            </div>
          </NavLink>

          <NavLink to="/matches" className={navItemClass}>
            <div className="flex items-center gap-3">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>AI Matches</span>
            </div>
          </NavLink>

          <NavLink to="/claims" className={navItemClass}>
            <div className="flex items-center gap-3">
              <ClipboardList className="w-4 h-4" />
              <span>My Claims</span>
            </div>
          </NavLink>

          <NavLink to="/notifications" className={navItemClass}>
            <div className="flex items-center gap-3">
              <Bell className="w-4 h-4" />
              <span>Notifications</span>
            </div>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 text-[10px] font-black bg-red-500 text-white rounded-full">
                {unreadCount}
              </span>
            )}
          </NavLink>

          <NavLink to="/profile" className={navItemClass}>
            <div className="flex items-center gap-3">
              <User className="w-4 h-4" />
              <span>Profile</span>
            </div>
          </NavLink>
        </div>

        {/* Admin Navigation Links */}
        {isAdmin && (
          <div className="space-y-1 pt-4 border-t border-slate-100">
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-blue-600 mb-2 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" />
              Admin Portal
            </p>

            <NavLink to="/admin/dashboard" className={navItemClass}>
              <div className="flex items-center gap-3">
                <LayoutDashboard className="w-4 h-4" />
                <span>Admin Overview</span>
              </div>
            </NavLink>

            <NavLink to="/admin/users" className={navItemClass}>
              <div className="flex items-center gap-3">
                <Users className="w-4 h-4" />
                <span>User Management</span>
              </div>
            </NavLink>

            <NavLink to="/admin/claims" className={navItemClass}>
              <div className="flex items-center gap-3">
                <ClipboardList className="w-4 h-4" />
                <span>Verify Claims & OTP</span>
              </div>
            </NavLink>

            <NavLink to="/admin/analytics" className={navItemClass}>
              <div className="flex items-center gap-3">
                <BarChart3 className="w-4 h-4" />
                <span>Analytics & Audit</span>
              </div>
            </NavLink>
          </div>
        )}
      </div>

      {/* Logout button at bottom */}
      <div className="pt-4 border-t border-slate-100">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-rose-600 hover:bg-rose-50 transition"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
