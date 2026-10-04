import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { LayoutDashboard, Users, CheckSquare, BarChart3, Shield } from 'lucide-react';

export default function AdminLayout() {
  const linkClass = ({ isActive }) =>
    `flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
      isActive
        ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
    }`;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <div className="bg-slate-900 text-white border-b border-slate-800 py-4 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-base font-black tracking-tight">Security & Administration Center</h1>
              <p className="text-xs text-slate-400">Campus Oversight, Claims Verification & Item Recovery Operations</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <NavLink to="/admin/dashboard" className={linkClass}>
              <LayoutDashboard className="w-4 h-4" />
              Overview
            </NavLink>
            <NavLink to="/admin/users" className={linkClass}>
              <Users className="w-4 h-4" />
              Users
            </NavLink>
            <NavLink to="/admin/claims" className={linkClass}>
              <CheckSquare className="w-4 h-4" />
              Claims & Handover
            </NavLink>
            <NavLink to="/admin/analytics" className={linkClass}>
              <BarChart3 className="w-4 h-4" />
              Analytics & Logs
            </NavLink>
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 min-w-0">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}
