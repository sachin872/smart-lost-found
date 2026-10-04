import React, { useState, useEffect } from 'react';
import { adminService, handoverService, claimService } from '../../services/api';
import {
  ClipboardList,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  HelpCircle,
  KeyRound,
  AlertCircle,
  Eye,
  MapPin,
  Clock,
  Sparkles,
} from 'lucide-react';
import StatusBadge from '../../components/StatusBadge';
import ScoreBadge from '../../components/ScoreBadge';
import Modal from '../../components/Modal';
import { TableSkeleton } from '../../components/SkeletonLoader';

export default function AdminClaims() {
  const [claims, setClaims] = useState([]);
  const [handovers, setHandovers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  // OTP Verification Desk State
  const [activeHandoverId, setActiveHandoverId] = useState('');
  const [enteredOtp, setEnteredOtp] = useState('');
  const [otpNotes, setOtpNotes] = useState('');
  const [otpResult, setOtpResult] = useState(null);
  const [otpError, setOtpError] = useState('');
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  const fetchClaimsAndHandovers = async () => {
    try {
      setLoading(true);
      const [claimRes, handoverRes] = await Promise.all([
        adminService.getDashboard(),
        handoverService.getAll(),
      ]);

      const allClaims = await claimService.getAll();
      setClaims(allClaims.data?.claims || []);
      setHandovers(handoverRes.data?.handovers || []);
    } catch (err) {
      console.error('Error fetching admin claims data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClaimsAndHandovers();
  }, []);

  const openReviewModal = (claim) => {
    setSelectedClaim(claim);
    setAdminNotes(claim.adminNotes || '');
    setReviewModalOpen(true);
  };

  const handleApprove = async () => {
    if (!selectedClaim) return;
    setProcessing(true);
    try {
      await adminService.approveClaim(selectedClaim._id, {
        adminNotes: adminNotes || 'Approved by campus security.',
        handoverLocation: 'Campus Security Main Office (Desk #3)',
      });
      setReviewModalOpen(false);
      await fetchClaimsAndHandovers();
    } catch (err) {
      alert(err.message || 'Approval failed');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedClaim) return;
    setProcessing(true);
    try {
      await adminService.rejectClaim(selectedClaim._id, {
        adminNotes: adminNotes || 'Verification failed. Details do not match record.',
      });
      setReviewModalOpen(false);
      await fetchClaimsAndHandovers();
    } catch (err) {
      alert(err.message || 'Rejection failed');
    } finally {
      setProcessing(false);
    }
  };

  const handleRequestInfo = async () => {
    if (!selectedClaim) return;
    setProcessing(true);
    try {
      await adminService.requestClaimInfo(selectedClaim._id, {
        message: adminNotes || 'Please provide photo proof or receipt of purchase.',
      });
      setReviewModalOpen(false);
      await fetchClaimsAndHandovers();
    } catch (err) {
      alert(err.message || 'Action failed');
    } finally {
      setProcessing(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setVerifyingOtp(true);
    setOtpError('');
    setOtpResult(null);

    try {
      const res = await handoverService.verify({
        handoverId: activeHandoverId,
        otp: enteredOtp,
        notes: otpNotes,
      });

      setOtpResult(res.data);
      setEnteredOtp('');
      await fetchClaimsAndHandovers();
    } catch (err) {
      setOtpError(err.message || 'Failed to verify OTP.');
    } finally {
      setVerifyingOtp(false);
    }
  };

  return (
    <div className="space-y-10 pb-16">
      {/* Header */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-2">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <ClipboardList className="w-6 h-6 text-blue-600" />
          Claims Verification & Handover Terminal
        </h1>
        <p className="text-xs text-slate-500">
          Cross-examine ownership answers, review AI confidence ratings, approve claim handovers, and verify 6-digit physical OTP return tokens.
        </p>
      </div>

      {/* OTP Handover Physical Desk Section (Requirement 21) */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-blue-300 border border-white/20">
            <KeyRound className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black tracking-tight">Security Handover Terminal (Enter OTP)</h2>
            <p className="text-xs text-slate-300">
              When an owner physically arrives at the security desk, enter their Handover ID and 6-digit OTP code to safely mark the item as RETURNED.
            </p>
          </div>
        </div>

        {otpResult && (
          <div className="p-4 bg-emerald-500/20 border border-emerald-400 text-emerald-200 rounded-2xl text-xs flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>
              <strong>Success:</strong> OTP cryptographically validated! Handover completed and item officially marked as <strong>RETURNED</strong>.
            </span>
          </div>
        )}

        {otpError && (
          <div className="p-4 bg-red-500/20 border border-red-400 text-red-200 rounded-2xl text-xs flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            <span>{otpError}</span>
          </div>
        )}

        <form onSubmit={handleVerifyOtp} className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
              Select Scheduled Handover Record
            </label>
            <select
              required
              value={activeHandoverId}
              onChange={(e) => setActiveHandoverId(e.target.value)}
              className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-xs text-white focus:outline-none focus:bg-slate-800"
            >
              <option value="" className="text-slate-900">
                -- Choose Active Handover --
              </option>
              {handovers.map((h) => (
                <option key={h._id} value={h._id} className="text-slate-900">
                  {h.ownerId?.name} ({h.ownerId?.email}) • Status: {h.status.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
              6-Digit Physical OTP
            </label>
            <input
              type="text"
              required
              maxLength={6}
              value={enteredOtp}
              onChange={(e) => setEnteredOtp(e.target.value)}
              placeholder="e.g. 583921"
              className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-sm font-mono tracking-widest text-center text-white focus:outline-none focus:bg-slate-800"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={verifyingOtp || !activeHandoverId}
              className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-2"
            >
              {verifyingOtp ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Verify OTP & Return Item
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Claims Review Queue */}
      <div className="space-y-4">
        <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-indigo-600" />
          Pending Ownership Claims Queue
        </h2>

        {loading ? (
          <TableSkeleton rows={4} />
        ) : claims.length === 0 ? (
          <div className="p-12 bg-white rounded-3xl border border-slate-200 text-center">
            <p className="text-sm font-bold text-slate-600">No ownership claims submitted yet.</p>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="p-4">Claimant</th>
                    <th className="p-4">Found Item</th>
                    <th className="p-4">AI Score</th>
                    <th className="p-4">Verification Score</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Review</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {claims.map((claim) => (
                    <tr key={claim._id} className="hover:bg-slate-50">
                      <td className="p-4">
                        <p className="font-bold text-slate-900">{claim.claimantId?.name}</p>
                        <p className="text-[11px] text-slate-500">{claim.claimantId?.email}</p>
                        <p className="text-[11px] text-slate-400">{claim.claimantId?.phone}</p>
                      </td>

                      <td className="p-4">
                        <p className="font-bold text-slate-800 line-clamp-1">
                          {claim.foundItemId?.title || 'Found item'}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {claim.foundItemId?.currentStorageLocation}
                        </p>
                      </td>

                      <td className="p-4">
                        <span className="font-black text-blue-600 text-sm">
                          {claim.matchId?.finalScore ? `${claim.matchId.finalScore}%` : 'N/A'}
                        </span>
                      </td>

                      <td className="p-4">
                        <span className="px-2.5 py-1 rounded-full text-xs font-black bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {claim.verificationScore}% Score
                        </span>
                      </td>

                      <td className="p-4">
                        <StatusBadge status={claim.verificationStatus} />
                      </td>

                      <td className="p-4 text-right">
                        <button
                          onClick={() => openReviewModal(claim)}
                          className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs transition inline-flex items-center gap-1.5 shadow-sm"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Review & Decide
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Detailed Claim Verification Modal (Requirement 20) */}
      <Modal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        title="Administrative Ownership Verification & Decision"
        maxWidth="max-w-3xl"
      >
        {selectedClaim && (
          <div className="space-y-6 text-xs">
            {/* Claimant & Item Header */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-2 gap-4">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400">Claimant</span>
                <p className="font-bold text-slate-900 text-sm">{selectedClaim.claimantId?.name}</p>
                <p className="text-slate-600">{selectedClaim.claimantId?.email}</p>
                <p className="text-slate-600">{selectedClaim.claimantId?.phone}</p>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400">Found Property</span>
                <p className="font-bold text-slate-900 text-sm">{selectedClaim.foundItemId?.title}</p>
                <p className="text-slate-600">Brand: {selectedClaim.foundItemId?.brand || 'None'}</p>
                <p className="text-slate-600">Storage: {selectedClaim.foundItemId?.currentStorageLocation}</p>
              </div>
            </div>

            {/* Scores Overview */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-2xl text-center space-y-1">
                <span className="text-[10px] font-bold text-blue-900 uppercase">AI Match Score</span>
                <p className="text-2xl font-black text-blue-700">
                  {selectedClaim.matchId?.finalScore || 90}%
                </p>
              </div>

              <div className="p-3.5 bg-indigo-50 border border-indigo-200 rounded-2xl text-center space-y-1">
                <span className="text-[10px] font-bold text-indigo-900 uppercase">Verification Score</span>
                <p className="text-2xl font-black text-indigo-700">
                  {selectedClaim.verificationScore}%
                </p>
              </div>
            </div>

            {/* User's Verification Answers */}
            <div className="space-y-3">
              <h4 className="font-bold text-slate-800 text-sm">Submitted Verification Answers:</h4>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div>
                  <strong className="text-slate-700 block">Stated Brand/Model:</strong>
                  <p className="text-slate-900 font-medium">
                    {selectedClaim.verificationAnswers?.itemBrand || 'None'}
                  </p>
                </div>

                <div>
                  <strong className="text-slate-700 block">Unique Marks / Scratches:</strong>
                  <p className="text-slate-900 font-medium">
                    {selectedClaim.verificationAnswers?.uniqueMarks || 'None'}
                  </p>
                </div>

                <div>
                  <strong className="text-slate-700 block">Contents Inside / Attachments:</strong>
                  <p className="text-slate-900 font-medium">
                    {selectedClaim.verificationAnswers?.contentsInside || 'None'}
                  </p>
                </div>

                <div>
                  <strong className="text-slate-700 block">Exact Stated Lost Location:</strong>
                  <p className="text-slate-900 font-medium">
                    {selectedClaim.verificationAnswers?.exactLostLocation || 'None'}
                  </p>
                </div>

                <div>
                  <strong className="text-slate-700 block">Hidden Features / Secret Notes:</strong>
                  <p className="text-slate-900 font-medium">
                    {selectedClaim.verificationAnswers?.hiddenFeatures || 'None'}
                  </p>
                </div>
              </div>
            </div>

            {/* Admin Notes Input */}
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">
                Administrative Notes / Reason
              </label>
              <textarea
                rows={2}
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Enter feedback for approval or reasons for requesting more info / rejection"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-600"
              />
            </div>

            {/* Decision Action Buttons (Requirement 20) */}
            <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setReviewModalOpen(false)}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-bold"
              >
                Close
              </button>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={processing}
                  onClick={handleReject}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold flex items-center gap-1.5 transition disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4" />
                  Reject Claim
                </button>

                <button
                  type="button"
                  disabled={processing}
                  onClick={handleRequestInfo}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold flex items-center gap-1.5 transition disabled:opacity-50"
                >
                  <HelpCircle className="w-4 h-4" />
                  Request More Info
                </button>

                <button
                  type="button"
                  disabled={processing}
                  onClick={handleApprove}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Approve & Issue OTP
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
