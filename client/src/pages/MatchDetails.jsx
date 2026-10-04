import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { matchService, claimService } from '../services/api';
import {
  Sparkles,
  ArrowLeft,
  ShieldCheck,
  MapPin,
  Calendar,
  Tag,
  CheckCircle2,
  AlertCircle,
  FileQuestion,
  Cpu,
} from 'lucide-react';
import ScoreBadge from '../components/ScoreBadge';
import Modal from '../components/Modal';

export default function MatchDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const [submittingClaim, setSubmittingClaim] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState(null);
  const [error, setError] = useState('');

  // Verification Questionnaire form state
  const [answers, setAnswers] = useState({
    itemBrand: '',
    uniqueMarks: '',
    contentsInside: '',
    exactLostLocation: '',
    hiddenFeatures: '',
    additionalProof: '',
  });

  useEffect(() => {
    const fetchMatch = async () => {
      try {
        setLoading(true);
        const res = await matchService.getById(id);
        setMatch(res.data?.match);
        // Pre-fill itemBrand from lost item if available
        if (res.data?.match?.lostItemId?.brand) {
          setAnswers((prev) => ({
            ...prev,
            itemBrand: res.data.match.lostItemId.brand,
          }));
        }
      } catch (err) {
        setError(err.message || 'Failed to fetch match details');
      } finally {
        setLoading(false);
      }
    };

    fetchMatch();
  }, [id]);

  const handleAnswerChange = (e) => {
    setAnswers({ ...answers, [e.target.name]: e.target.value });
  };

  const handleClaimSubmit = async (e) => {
    e.preventDefault();
    setSubmittingClaim(true);
    setError('');

    try {
      const res = await claimService.create({
        matchId: match._id,
        lostItemId: match.lostItemId?._id,
        foundItemId: match.foundItemId?._id,
        verificationAnswers: answers,
      });

      setClaimSuccess(res.data?.claim);
    } catch (err) {
      setError(err.message || 'Failed to submit ownership claim.');
    } finally {
      setSubmittingClaim(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!match) {
    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-slate-200">
        <p className="text-slate-600 font-bold">Match record not found.</p>
        <Link to="/matches" className="text-blue-600 underline text-sm mt-2 block">
          Back to Matches
        </Link>
      </div>
    );
  }

  const lost = match.lostItemId || {};
  const found = match.foundItemId || {};

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <Link
          to="/matches"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Matches
        </Link>

        <button
          onClick={() => setClaimModalOpen(true)}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition flex items-center gap-1.5"
        >
          <ShieldCheck className="w-4 h-4" />
          Submit Ownership Claim
        </button>
      </div>

      {/* Main Analysis Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-white/10">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
              AI Multi-Factor Correlation
            </span>
            <h1 className="text-2xl font-black mt-1">Smart Match Evaluation</h1>
          </div>
          <div className="flex items-center gap-4">
            <ScoreBadge score={match.finalScore} confidenceLevel={match.confidenceLevel} size="lg" />
          </div>
        </div>

        {/* AI Breakdown Scores Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 text-center">
          <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
            <span className="text-[10px] uppercase font-bold text-slate-400">Text (30%)</span>
            <p className="text-lg font-black text-blue-300">{match.textScore}%</p>
          </div>
          <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
            <span className="text-[10px] uppercase font-bold text-slate-400">Image (30%)</span>
            <p className="text-lg font-black text-indigo-300">{match.imageScore}%</p>
          </div>
          <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
            <span className="text-[10px] uppercase font-bold text-slate-400">Category (10%)</span>
            <p className="text-lg font-black text-white">{match.categoryScore}%</p>
          </div>
          <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
            <span className="text-[10px] uppercase font-bold text-slate-400">Color (5%)</span>
            <p className="text-lg font-black text-white">{match.colorScore}%</p>
          </div>
          <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
            <span className="text-[10px] uppercase font-bold text-slate-400">Brand (5%)</span>
            <p className="text-lg font-black text-white">{match.brandScore}%</p>
          </div>
          <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
            <span className="text-[10px] uppercase font-bold text-slate-400">Location (10%)</span>
            <p className="text-lg font-black text-emerald-300">{match.locationScore}%</p>
          </div>
          <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
            <span className="text-[10px] uppercase font-bold text-slate-400">Time (10%)</span>
            <p className="text-lg font-black text-amber-300">{match.timeScore}%</p>
          </div>
        </div>

        {/* AI Analysis Justification Callout */}
        <div className="p-4 bg-white/10 rounded-2xl border border-white/15 space-y-1">
          <p className="text-xs font-bold uppercase tracking-wider text-blue-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-300" />
            AI Match Analysis:
          </p>
          <p className="text-sm font-medium text-slate-200 italic leading-relaxed">
            "{match.matchReason}"
          </p>
        </div>
      </div>

      {/* Side-by-Side Comparison Table (As explicitly requested in requirement 18) */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-base font-black text-slate-900">Side-by-Side Attribute Comparison</h2>
          <p className="text-xs text-slate-500">
            Review detailed parameters reported by the owner versus the campus finder.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100">
          {/* LOST ITEM COLUMN */}
          <div className="p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-rose-100 text-rose-700">
                Lost Item Report
              </span>
              <span className="text-xs text-slate-400">
                Reported by {lost.userId?.name || 'Owner'}
              </span>
            </div>

            {/* Image */}
            <div className="aspect-video bg-slate-100 rounded-2xl overflow-hidden border border-slate-200">
              <img
                src={
                  lost.imageUrls?.[0] ||
                  'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80'
                }
                alt={lost.title}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <p className="font-bold text-slate-400 uppercase text-[10px]">Title</p>
                <p className="font-black text-sm text-slate-900 mt-0.5">{lost.title}</p>
              </div>

              <div>
                <p className="font-bold text-slate-400 uppercase text-[10px]">Description</p>
                <p className="text-slate-700 mt-0.5 leading-relaxed">{lost.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <div>
                  <p className="font-bold text-slate-400 uppercase text-[10px]">Category</p>
                  <p className="font-semibold text-slate-800">{lost.category}</p>
                </div>
                <div>
                  <p className="font-bold text-slate-400 uppercase text-[10px]">Brand</p>
                  <p className="font-semibold text-slate-800">{lost.brand || 'Unspecified'}</p>
                </div>
                <div>
                  <p className="font-bold text-slate-400 uppercase text-[10px]">Color</p>
                  <p className="font-semibold text-slate-800">{lost.color || 'Unspecified'}</p>
                </div>
                <div>
                  <p className="font-bold text-slate-400 uppercase text-[10px]">Condition</p>
                  <p className="font-semibold text-slate-800">{lost.condition || 'Good'}</p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-2">
                <div>
                  <p className="font-bold text-slate-400 uppercase text-[10px]">Lost Location</p>
                  <p className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    {lost.lostLocation}
                  </p>
                </div>
                <div>
                  <p className="font-bold text-slate-400 uppercase text-[10px]">Date & Time</p>
                  <p className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    {new Date(lost.lostDate).toLocaleDateString()}{' '}
                    {lost.lostTime ? `at ${lost.lostTime}` : ''}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* FOUND ITEM COLUMN */}
          <div className="p-6 space-y-5 bg-slate-50/30">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-100 text-emerald-700">
                Found Item Report
              </span>
              <span className="text-xs text-slate-400">
                Turned in by {found.finderId?.name || 'Campus Finder'}
              </span>
            </div>

            {/* Image */}
            <div className="aspect-video bg-slate-100 rounded-2xl overflow-hidden border border-slate-200">
              <img
                src={
                  found.imageUrls?.[0] ||
                  'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80'
                }
                alt={found.title}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <p className="font-bold text-slate-400 uppercase text-[10px]">Title</p>
                <p className="font-black text-sm text-slate-900 mt-0.5">{found.title}</p>
              </div>

              <div>
                <p className="font-bold text-slate-400 uppercase text-[10px]">Description</p>
                <p className="text-slate-700 mt-0.5 leading-relaxed">{found.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <div>
                  <p className="font-bold text-slate-400 uppercase text-[10px]">Category</p>
                  <p className="font-semibold text-slate-800">{found.category}</p>
                </div>
                <div>
                  <p className="font-bold text-slate-400 uppercase text-[10px]">Brand</p>
                  <p className="font-semibold text-slate-800">{found.brand || 'Unspecified'}</p>
                </div>
                <div>
                  <p className="font-bold text-slate-400 uppercase text-[10px]">Color</p>
                  <p className="font-semibold text-slate-800">{found.color || 'Unspecified'}</p>
                </div>
                <div>
                  <p className="font-bold text-slate-400 uppercase text-[10px]">Condition</p>
                  <p className="font-semibold text-slate-800">{found.condition || 'Good'}</p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-2">
                <div>
                  <p className="font-bold text-slate-400 uppercase text-[10px]">Found Location</p>
                  <p className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    {found.foundLocation}
                  </p>
                </div>
                <div>
                  <p className="font-bold text-slate-400 uppercase text-[10px]">Date & Time</p>
                  <p className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    {new Date(found.foundDate).toLocaleDateString()}{' '}
                    {found.foundTime ? `at ${found.foundTime}` : ''}
                  </p>
                </div>
                <div>
                  <p className="font-bold text-slate-400 uppercase text-[10px]">Current Storage</p>
                  <p className="font-medium text-slate-600 mt-0.5">
                    {found.currentStorageLocation || 'Campus Security Safe'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Button Section at bottom */}
        <div className="p-6 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-500">
            Confident this is your property? Proceed to answer ownership verification questions.
          </div>
          <button
            onClick={() => setClaimModalOpen(true)}
            className="w-full sm:w-auto px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-md shadow-blue-500/25 transition flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-5 h-5" />
            Submit Ownership Claim
          </button>
        </div>
      </div>

      {/* Ownership Verification Questionnaire Modal (Requirement 19) */}
      <Modal
        isOpen={claimModalOpen}
        onClose={() => setClaimModalOpen(false)}
        title="Ownership Verification Questionnaire"
        maxWidth="max-w-2xl"
      >
        {claimSuccess ? (
          <div className="space-y-4 py-4 text-center">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-black text-slate-900">Claim Registered Successfully!</h3>
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl max-w-md mx-auto text-left space-y-2 text-xs text-emerald-800">
              <p>
                <strong>Calculated Verification Score:</strong>{' '}
                <span className="text-base font-black text-emerald-950">
                  {claimSuccess.verificationScore}%
                </span>
              </p>
              <p>
                Your answers have been forwarded to the campus security administrators for final validation.
                Upon approval, you will receive an encrypted 6-digit OTP code to present at pickup.
              </p>
            </div>
            <div className="pt-4 flex justify-center gap-3">
              <button
                onClick={() => navigate('/claims')}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition"
              >
                Track Claim Status
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleClaimSubmit} className="space-y-4 text-xs">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-slate-700 leading-relaxed">
              <strong>Notice:</strong> To prevent fraud and false claims, please answer the questions below as accurately as possible. Answers are compared against confidential details held by campus security.
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700">
                {error}
              </div>
            )}

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">
                1. What brand or specific model was the item? *
              </label>
              <input
                type="text"
                name="itemBrand"
                required
                value={answers.itemBrand}
                onChange={handleAnswerChange}
                placeholder="e.g. Nike, Apple iPhone 15 Pro, Fossil"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-600 focus:bg-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">
                2. What unique marks, stickers, or scratches did it have? *
              </label>
              <textarea
                name="uniqueMarks"
                required
                rows={2}
                value={answers.uniqueMarks}
                onChange={handleAnswerChange}
                placeholder="e.g. Red keychain attached to left carabiner, tiny scratch on front zipper"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-600 focus:bg-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">
                3. What was inside it or attached to it? *
              </label>
              <textarea
                name="contentsInside"
                required
                rows={2}
                value={answers.contentsInside}
                onChange={handleAnswerChange}
                placeholder="e.g. Dell XPS charger, blue spiral notebook, USB-C adapter cable"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-600 focus:bg-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">
                4. Where exactly do you recall losing it? *
              </label>
              <input
                type="text"
                name="exactLostLocation"
                required
                value={answers.exactLostLocation}
                onChange={handleAnswerChange}
                placeholder="e.g. College Library, 2nd Floor Study Room near window desk"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-600 focus:bg-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">
                5. Describe a hidden feature or password/lockscreen detail:
              </label>
              <input
                type="text"
                name="hiddenFeatures"
                value={answers.hiddenFeatures}
                onChange={handleAnswerChange}
                placeholder="e.g. Hidden inner passport pocket, initials embossed inside fold"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-600 focus:bg-white"
              />
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setClaimModalOpen(false)}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingClaim}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-md shadow-blue-500/20 disabled:opacity-50"
              >
                {submittingClaim ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    Submit for Verification
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
