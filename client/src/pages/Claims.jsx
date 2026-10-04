import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { claimService, handoverService } from '../services/api';
import {
  ClipboardList,
  ShieldCheck,
  MapPin,
  Calendar,
  KeyRound,
  CheckCircle2,
  Clock,
  AlertCircle,
} from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import { TableSkeleton } from '../components/SkeletonLoader';
import Modal from '../components/Modal';

export default function Claims() {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedHandover, setSelectedHandover] = useState(null);
  const [otpModalOpen, setOtpModalOpen] = useState(false);

  const fetchClaims = async () => {
    try {
      setLoading(true);
      const res = await claimService.getAll({ status: statusFilter });
      setClaims(res.data?.claims || []);
    } catch (err) {
      console.error('Failed to load claims:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClaims();
  }, [statusFilter]);

  const viewHandoverOtp = async (claimId) => {
    try {
      const res = await handoverService.getAll();
      const match = res.data?.handovers?.find((h) => h.claimId?._id === claimId || h.claimId === claimId);
      if (match) {
        setSelectedHandover(match);
        setOtpModalOpen(true);
      }
    } catch (err) {
      console.error('Failed to fetch handover:', err);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-blue-600" />
            My Ownership Claims
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track validation progress, security approvals, and receive your secure pickup OTP codes.
          </p>
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
        >
          <option value="All">All Claim Statuses</option>
          <option value="pending">Pending Review</option>
          <option value="approved">Approved & Ready</option>
          <option value="info_requested">Info Requested</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {loading ? (
        <TableSkeleton rows={4} />
      ) : claims.length === 0 ? (
        <div className="p-12 bg-white rounded-3xl border border-slate-200 text-center space-y-3">
          <ClipboardList className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-700">No Claims Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            When you discover a potential match for your lost item, click 'Submit Ownership Claim' to register a claim.
          </p>
          <Link
            to="/matches"
            className="inline-block px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-sm"
          >
            Browse Potential Matches
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {claims.map((claim) => {
            const found = claim.foundItemId || {};

            return (
              <div
                key={claim._id}
                className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition space-y-5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <img
                      src={
                        found.imageUrls?.[0] ||
                        'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=200&q=80'
                      }
                      alt={found.title}
                      className="w-14 h-14 rounded-2xl object-cover border border-slate-200 shrink-0"
                    />
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Claimed Found Item
                      </span>
                      <h3 className="text-base font-bold text-slate-900">{found.title || 'Item'}</h3>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        Storage: {found.currentStorageLocation || 'Campus Security'}
                      </p>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
                    <StatusBadge status={claim.verificationStatus} />
                    <span className="text-xs text-slate-400">
                      Filed {new Date(claim.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Score & Notes callout */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3.5 bg-blue-50/60 rounded-2xl border border-blue-100 text-xs space-y-1">
                    <p className="font-bold text-blue-900 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-blue-600" />
                      Verification Score: <span className="text-sm font-black">{claim.verificationScore}%</span>
                    </p>
                    <p className="text-slate-600 text-[11px] leading-relaxed">
                      Calculated from unique marks, location alignment, and secret features matching campus logs.
                    </p>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-xs space-y-1">
                    <p className="font-bold text-slate-700">Administrator Remarks:</p>
                    <p className="text-slate-500 text-[11px] italic">
                      {claim.adminNotes || 'Under active administrative validation by campus security.'}
                    </p>
                  </div>
                </div>

                {/* Handover notification CTA if approved */}
                {claim.verificationStatus === 'approved' && (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-emerald-900">
                    <div className="flex items-center gap-2">
                      <KeyRound className="w-5 h-5 text-emerald-600 shrink-0" />
                      <div>
                        <p className="font-black text-sm">Claim Approved & Ready for Pickup!</p>
                        <p className="text-[11px] text-emerald-800">
                          Visit your designated campus security desk and present your secret 6-digit OTP.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => viewHandoverOtp(claim._id)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-sm transition whitespace-nowrap"
                    >
                      View Pickup Instructions & OTP
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pickup & OTP Instruction Modal */}
      <Modal
        isOpen={otpModalOpen}
        onClose={() => setOtpModalOpen(false)}
        title="Official Handover & Pickup Verification"
        maxWidth="max-w-md"
      >
        {selectedHandover ? (
          <div className="space-y-4 text-center">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <KeyRound className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-lg font-black text-slate-900">Your Handover Credentials</h3>
              <p className="text-xs text-slate-500 mt-1">
                Present this information to the authorized security officer to claim your possession.
              </p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-left space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Pickup Location:</span>
                <strong className="text-slate-800">{selectedHandover.handoverLocation}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Scheduled Time:</span>
                <strong className="text-slate-800">{selectedHandover.scheduledTime}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Handover Status:</span>
                <span className="capitalize font-bold text-emerald-600">{selectedHandover.status}</span>
              </div>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl space-y-2">
              <span className="text-xs font-bold text-blue-900 uppercase tracking-widest">
                Confidential Handover OTP
              </span>
              <p className="text-xs text-slate-600">
                Check your notification center for the 6-digit cryptographic verification code delivered to your account upon claim approval.
              </p>
              <Link
                to="/notifications"
                onClick={() => setOtpModalOpen(false)}
                className="inline-block mt-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition"
              >
                Go to Notification Center to view OTP
              </Link>
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-500 text-center py-4">
            Loading handover details...
          </p>
        )}
      </Modal>
    </div>
  );
}
