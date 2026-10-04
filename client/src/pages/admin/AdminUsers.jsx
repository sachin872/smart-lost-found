import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/api';
import { Users, Search, Shield, Ban, CheckCircle, Mail, Phone, Calendar } from 'lucide-react';
import { TableSkeleton } from '../../components/SkeletonLoader';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actionMessage, setActionMessage] = useState('');

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await adminService.getUsers({
        search,
        role: roleFilter,
        page,
        limit: 15,
      });
      setUsers(res.data?.users || []);
      setTotalPages(res.data?.pagination?.pages || 1);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter, page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const toggleBlock = async (userId, currentBlocked) => {
    try {
      const res = await adminService.toggleUserBlock(userId);
      setActionMessage(res.message || 'User status updated');
      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, isBlocked: !currentBlocked } : u))
      );
      setTimeout(() => setActionMessage(''), 3000);
    } catch (err) {
      alert(err.message || 'Action failed');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            User Account Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Review registered campus accounts, search by email/name, and manage permissions or suspensions.
          </p>
        </div>

        {actionMessage && (
          <div className="px-4 py-2 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold animate-fade-in">
            {actionMessage}
          </div>
        )}
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="w-full sm:w-80 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or phone..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-600 focus:bg-white transition"
          />
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {['All', 'user', 'finder', 'admin'].map((role) => (
            <button
              key={role}
              onClick={() => {
                setRoleFilter(role);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition ${
                roleFilter === role
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              {role === 'user' ? 'Students' : role === 'finder' ? 'Finders' : role}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      {loading ? (
        <TableSkeleton rows={6} />
      ) : users.length === 0 ? (
        <div className="p-12 bg-white rounded-3xl border border-slate-200 text-center">
          <p className="text-sm font-bold text-slate-600">No users match your criteria.</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-4">User</th>
                  <th className="p-4">Contact Info</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Registered Date</th>
                  <th className="p-4 text-right">Moderation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-50">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {u.profileImage ? (
                          <img
                            src={u.profileImage}
                            alt={u.name}
                            className="w-9 h-9 rounded-full object-cover border border-slate-200"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
                            {u.name.charAt(0)}
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-slate-900">{u.name}</p>
                          <p className="text-[11px] text-slate-400">ID: {u._id.slice(-6)}</p>
                        </div>
                      </div>
                    </td>

                    <td className="p-4 space-y-0.5">
                      <p className="text-slate-700 flex items-center gap-1.5 font-medium">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        {u.email}
                      </p>
                      <p className="text-slate-500 flex items-center gap-1.5 text-[11px]">
                        <Phone className="w-3 h-3 text-slate-400" />
                        {u.phone}
                      </p>
                    </td>

                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
                        {u.role}
                      </span>
                    </td>

                    <td className="p-4">
                      {u.isBlocked ? (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200">
                          Suspended
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                          Active
                        </span>
                      )}
                    </td>

                    <td className="p-4 text-slate-500">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>

                    <td className="p-4 text-right">
                      {u.role !== 'admin' && (
                        <button
                          onClick={() => toggleBlock(u._id, u.isBlocked)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ml-auto ${
                            u.isBlocked
                              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                              : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                          }`}
                        >
                          {u.isBlocked ? (
                            <>
                              <CheckCircle className="w-3.5 h-3.5" />
                              Unblock User
                            </>
                          ) : (
                            <>
                              <Ban className="w-3.5 h-3.5" />
                              Block User
                            </>
                          )}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
