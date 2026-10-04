import React from 'react';
import { Compass, ShieldCheck, Cpu, Database } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200 mt-auto py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">Smart Lost & Found System</p>
              <p className="text-xs text-slate-500">Autonomous recovery, semantic matching & secure handover platform</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Cpu className="w-3.5 h-3.5 text-blue-600" /> Modular AI Match Engine
            </span>
            <span className="flex items-center gap-1">
              <Database className="w-3.5 h-3.5 text-emerald-600" /> MongoDB Atlas Persistent
            </span>
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" /> Hashed OTP Handover
            </span>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400">
          <p>© {new Date().getFullYear()} Smart Lost & Found System. All rights reserved.</p>
          <p className="mt-2 sm:mt-0">Enterprise-grade security, rate-limiting & automated ownership verification.</p>
        </div>
      </div>
    </footer>
  );
}
