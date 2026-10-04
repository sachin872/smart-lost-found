import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { foundService } from '../services/api';
import ImageUpload from '../components/ImageUpload';
import { CheckCircle2, Sparkles, AlertCircle, ArrowRight, Shield } from 'lucide-react';
import Modal from '../components/Modal';
import ScoreBadge from '../components/ScoreBadge';

const CATEGORIES = [
  'Bags & Luggage',
  'Electronics',
  'Wallets & Cards',
  'Clothing & Wearables',
  'Keys & Accessories',
  'Books & Documents',
  'Jewelry',
  'Other',
];

const CONDITIONS = ['New', 'Like New', 'Good', 'Fair', 'Poor', 'Worn', 'Unknown'];

export default function ReportFound() {
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [matchModalOpen, setMatchModalOpen] = useState(false);
  const [matchResults, setMatchResults] = useState([]);

  const [formData, setFormData] = useState({
    title: '',
    category: 'Bags & Luggage',
    subcategory: '',
    description: '',
    brand: '',
    color: 'Black',
    condition: 'Good',
    uniqueFeatures: '',
    serialNumber: '',
    foundLocation: '',
    foundDate: new Date().toISOString().split('T')[0],
    foundTime: '',
    currentStorageLocation: 'Campus Security Main Office (Desk #3)',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.title || !formData.description || !formData.foundLocation || !formData.foundDate) {
      setError('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    try {
      const data = new FormData();
      Object.keys(formData).forEach((key) => {
        if (formData[key]) data.append(key, formData[key]);
      });

      files.forEach((file) => {
        data.append('images', file);
      });

      const res = await foundService.create(data);
      const generatedMatches = res.data?.matches || [];

      if (generatedMatches.length > 0) {
        setMatchResults(generatedMatches);
        setMatchModalOpen(true);
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Failed to submit found report.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-2">
        <div className="flex items-center gap-2 text-emerald-600">
          <CheckCircle2 className="w-6 h-6" />
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Report a Found Item</h1>
        </div>
        <p className="text-xs text-slate-500">
          Thank you for turning in a found item. Our automated system searches lost reports and notifies legitimate owners while keeping storage locations securely tracked.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Item Name / Headline *
          </label>
          <input
            type="text"
            name="title"
            required
            value={formData.title}
            onChange={handleChange}
            placeholder="e.g. Black backpack found outside central library"
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-600 focus:bg-white transition"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Category *
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-600 focus:bg-white transition"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Subcategory
            </label>
            <input
              type="text"
              name="subcategory"
              value={formData.subcategory}
              onChange={handleChange}
              placeholder="e.g. Backpack, Headphones, Water Bottle"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-600 focus:bg-white transition"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Description of Item *
          </label>
          <textarea
            name="description"
            required
            rows={3}
            value={formData.description}
            onChange={handleChange}
            placeholder="Describe the item general appearance, brand logos, condition, etc."
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-600 focus:bg-white transition"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Brand / Manufacturer
            </label>
            <input
              type="text"
              name="brand"
              value={formData.brand}
              onChange={handleChange}
              placeholder="e.g. Nike, Apple, Sony"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-600 focus:bg-white transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Primary Color
            </label>
            <input
              type="text"
              name="color"
              value={formData.color}
              onChange={handleChange}
              placeholder="e.g. Black, Navy, Silver"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-600 focus:bg-white transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Condition
            </label>
            <select
              name="condition"
              value={formData.condition}
              onChange={handleChange}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-600 focus:bg-white transition"
            >
              {CONDITIONS.map((cond) => (
                <option key={cond} value={cond}>
                  {cond}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Unique Features / Secret Marks
            </label>
            <input
              type="text"
              name="uniqueFeatures"
              value={formData.uniqueFeatures}
              onChange={handleChange}
              placeholder="e.g. Scratch on zipper; red keychain attached"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-600 focus:bg-white transition"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Keep critical confidential details here for verification scoring.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Serial Number (If visible)
            </label>
            <input
              type="text"
              name="serialNumber"
              value={formData.serialNumber}
              onChange={handleChange}
              placeholder="e.g. SN or Model identifier"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-600 focus:bg-white transition"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-1">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Found Location *
            </label>
            <input
              type="text"
              name="foundLocation"
              required
              value={formData.foundLocation}
              onChange={handleChange}
              placeholder="e.g. Outside Central Library bench"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-600 focus:bg-white transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Date Found *
            </label>
            <input
              type="date"
              name="foundDate"
              required
              value={formData.foundDate}
              onChange={handleChange}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-600 focus:bg-white transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Approx. Time Found
            </label>
            <input
              type="time"
              name="foundTime"
              value={formData.foundTime}
              onChange={handleChange}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-600 focus:bg-white transition"
            />
          </div>
        </div>

        {/* Current Storage Location */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Current Physical Storage Location *
          </label>
          <div className="relative">
            <Shield className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              name="currentStorageLocation"
              required
              value={formData.currentStorageLocation}
              onChange={handleChange}
              placeholder="e.g. Campus Security Safe Box #14, Room 102"
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-600 focus:bg-white transition"
            />
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Where the item is currently kept until handover to its verified owner.
          </p>
        </div>

        {/* Image Upload Component */}
        <ImageUpload
          files={files}
          setFiles={setFiles}
          previews={previews}
          setPreviews={setPreviews}
          maxFiles={4}
        />

        {/* Action Buttons */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-7 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-sm shadow-md shadow-emerald-500/20 transition flex items-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Submit & Evaluate Matches
              </>
            )}
          </button>
        </div>
      </form>

      {/* Immediate Match Discovery Modal */}
      <Modal
        isOpen={matchModalOpen}
        onClose={() => navigate('/dashboard')}
        title="✨ Potential Owner Reports Detected!"
        maxWidth="max-w-2xl"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600">
            Great news! The item you submitted has correlated with{' '}
            <strong>{matchResults.length} registered lost report(s)</strong>:
          </p>

          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {matchResults.map((m) => (
              <div
                key={m._id}
                className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">{m.lostItemId?.title || 'Lost Item'}</h4>
                    <p className="text-xs text-slate-500">Lost At: {m.lostItemId?.lostLocation}</p>
                  </div>
                  <ScoreBadge score={m.finalScore} confidenceLevel={m.confidenceLevel} size="sm" />
                </div>
                <p className="text-xs text-slate-600 italic bg-white p-2.5 rounded-xl border border-slate-100">
                  "{m.matchReason}"
                </p>
                <div className="flex justify-end">
                  <button
                    onClick={() => navigate(`/matches/${m._id}`)}
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm transition"
                  >
                    View Match Comparison
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end">
            <button
              onClick={() => navigate('/dashboard')}
              className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
