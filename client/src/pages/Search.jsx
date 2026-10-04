import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { searchService } from '../services/api';
import {
  Search as SearchIcon,
  Sparkles,
  Filter,
  MapPin,
  Calendar,
  Tag,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import { CardSkeleton } from '../components/SkeletonLoader';

const CATEGORIES = [
  'All',
  'Bags & Luggage',
  'Electronics',
  'Wallets & Cards',
  'Clothing & Wearables',
  'Keys & Accessories',
  'Books & Documents',
  'Jewelry',
];

const STATUSES = ['All', 'reported', 'matched', 'claimed', 'returned'];

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [type, setType] = useState(searchParams.get('type') || 'all');
  const [category, setCategory] = useState(searchParams.get('category') || 'All');
  const [color, setColor] = useState(searchParams.get('color') || '');
  const [location, setLocation] = useState(searchParams.get('location') || '');
  const [status, setStatus] = useState(searchParams.get('status') || 'All');

  const [results, setResults] = useState([]);
  const [parsedNlp, setParsedNlp] = useState(null);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);

  const fetchResults = async () => {
    setLoading(true);
    try {
      const res = await searchService.search({
        q: query,
        type,
        category,
        color,
        location,
        status,
        limit: 20,
      });

      setResults(res.data?.results || []);
      setParsedNlp(res.data?.parsedNlp || null);
      setTotal(res.data?.pagination?.total || 0);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, [type, category, status]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchResults();
  };

  const resetFilters = () => {
    setQuery('');
    setType('all');
    setCategory('All');
    setColor('');
    setLocation('');
    setStatus('All');
  };

  const handleSampleQuery = (sample) => {
    setQuery(sample);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <SearchIcon className="w-6 h-6 text-blue-600" />
            Natural-Language Smart Search
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Type free-form natural language queries or apply structured filters. Our NLP parser automatically extracts keywords, colors, dates, and locations.
          </p>
        </div>

        {/* Natural Language Search Input */}
        <form onSubmit={handleSearchSubmit} className="space-y-2">
          <div className="relative">
            <SearchIcon className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. 'I lost my black wallet near the canteen yesterday' or 'laptop bag library'"
              className="w-full pl-12 pr-28 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-blue-600 focus:bg-white shadow-inner transition"
            />
            <button
              type="submit"
              className="absolute right-2 top-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
            >
              Search
            </button>
          </div>

          {/* Quick NLP query chips */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Try Examples:</span>
            <button
              type="button"
              onClick={() => handleSampleQuery('I lost my black wallet near the canteen yesterday')}
              className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-600 font-medium transition"
            >
              "black wallet near canteen yesterday"
            </button>
            <button
              type="button"
              onClick={() => handleSampleQuery('navy backpack with Nike logo')}
              className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-600 font-medium transition"
            >
              "navy backpack with Nike logo"
            </button>
            <button
              type="button"
              onClick={() => handleSampleQuery('iPhone with blue case')}
              className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-600 font-medium transition"
            >
              "iPhone with blue case"
            </button>
          </div>
        </form>

        {/* NLP Extraction Feedback Badge */}
        {parsedNlp && (
          <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-2xl flex flex-wrap items-center gap-2 text-xs">
            <span className="font-bold text-blue-900 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" /> NLP Parsed:
            </span>
            {parsedNlp.intent !== 'all' && (
              <span className="px-2 py-0.5 rounded bg-blue-200/80 text-blue-900 font-bold uppercase text-[10px]">
                Intent: {parsedNlp.intent}
              </span>
            )}
            {parsedNlp.color && (
              <span className="px-2 py-0.5 rounded bg-blue-200/80 text-blue-900 font-medium">
                Color: {parsedNlp.color}
              </span>
            )}
            {parsedNlp.category && (
              <span className="px-2 py-0.5 rounded bg-blue-200/80 text-blue-900 font-medium">
                Category: {parsedNlp.category}
              </span>
            )}
            {parsedNlp.location && (
              <span className="px-2 py-0.5 rounded bg-blue-200/80 text-blue-900 font-medium">
                Location: {parsedNlp.location}
              </span>
            )}
            {parsedNlp.date && (
              <span className="px-2 py-0.5 rounded bg-blue-200/80 text-blue-900 font-medium">
                Date: {parsedNlp.date}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-wrap items-center justify-between gap-4">
        {/* Type Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
          {['all', 'lost', 'found'].map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold capitalize transition ${
                type === t ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t === 'all' ? 'All Items' : `${t} Items`}
            </button>
          ))}
        </div>

        {/* Dropdowns */}
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                Category: {c}
              </option>
            ))}
          </select>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                Status: {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>

          <button
            onClick={resetFilters}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition"
            title="Reset Filters"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search Results Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs text-slate-500 font-semibold px-1">
          <span>Found {total} matched records</span>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : results.length === 0 ? (
          <div className="p-12 bg-white rounded-3xl border border-slate-200 text-center space-y-3">
            <SearchIcon className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-base font-bold text-slate-700">No Items Match Your Criteria</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Try adjusting your query, clearing filters, or submit a new report so that our AI matching engine can alert you when it turns up.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.map((item) => (
              <div
                key={item._id}
                className="bg-white rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-md transition overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <div className="relative aspect-video bg-slate-100 overflow-hidden">
                    <img
                      src={
                        item.imageUrls?.[0] ||
                        'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=400&q=80'
                      }
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 left-3">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          item.itemType === 'lost'
                            ? 'bg-rose-500 text-white'
                            : 'bg-emerald-500 text-white'
                        }`}
                      >
                        {item.itemType}
                      </span>
                    </div>
                    <div className="absolute top-3 right-3">
                      <StatusBadge status={item.status} />
                    </div>
                  </div>

                  <div className="p-5 space-y-3">
                    <h3 className="font-bold text-sm text-slate-900 line-clamp-1">{item.title}</h3>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>

                    <div className="space-y-1.5 text-xs text-slate-500 pt-2 border-t border-slate-100">
                      <div className="flex items-center gap-1.5 truncate">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{item.lostLocation || item.foundLocation}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>
                          {new Date(item.lostDate || item.foundDate).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>
                          {item.category} {item.brand ? `• ${item.brand}` : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-5 pt-0">
                  <Link
                    to={item.itemType === 'lost' ? `/lost/${item._id}` : `/found/${item._id}`}
                    className="w-full py-2 bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 font-bold text-xs rounded-xl border border-slate-200 hover:border-blue-200 transition flex items-center justify-center gap-1"
                  >
                    View Details
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
