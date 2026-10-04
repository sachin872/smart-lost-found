import LostItem from '../models/LostItem.js';
import FoundItem from '../models/FoundItem.js';
import { parseNaturalLanguageQuery } from '../services/nlpParserService.js';

// @desc    Unified search for Lost and Found items with NLP parsing support
// @route   GET /api/search
// @access  Public
export const searchItems = async (req, res, next) => {
  try {
    const {
      q, // Text or natural language query
      type = 'all', // 'all', 'lost', 'found'
      category,
      brand,
      color,
      location,
      status,
      date,
      page = 1,
      limit = 12,
    } = req.query;

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 12;
    const skip = (pageNum - 1) * limitNum;

    // Check if query is natural language
    let parsedNlp = null;
    if (q && q.trim().length > 3) {
      parsedNlp = parseNaturalLanguageQuery(q);
    }

    // Effective search parameters (query string overrides or augments parsed NLP)
    const effectiveCategory = category && category !== 'All' ? category : parsedNlp?.category || '';
    const effectiveColor = color && color !== 'All' ? color : parsedNlp?.color || '';
    const effectiveBrand = brand || parsedNlp?.brand || '';
    const effectiveLocation = location || parsedNlp?.location || '';
    const effectiveType = type !== 'all' ? type : parsedNlp?.intent !== 'all' ? parsedNlp.intent : 'all';
    const effectiveDate = date || parsedNlp?.date || null;

    // Construct Lost query
    const lostQuery = {};
    const foundQuery = {};

    if (effectiveCategory) {
      lostQuery.category = effectiveCategory;
      foundQuery.category = effectiveCategory;
    }

    if (effectiveColor) {
      lostQuery.color = new RegExp(effectiveColor, 'i');
      foundQuery.color = new RegExp(effectiveColor, 'i');
    }

    if (effectiveBrand) {
      lostQuery.brand = new RegExp(effectiveBrand, 'i');
      foundQuery.brand = new RegExp(effectiveBrand, 'i');
    }

    if (effectiveLocation) {
      lostQuery.lostLocation = new RegExp(effectiveLocation, 'i');
      foundQuery.foundLocation = new RegExp(effectiveLocation, 'i');
    }

    if (status && status !== 'All') {
      lostQuery.status = status;
      foundQuery.status = status;
    }

    if (effectiveDate) {
      const searchDay = new Date(effectiveDate);
      const nextDay = new Date(searchDay);
      nextDay.setDate(nextDay.getDate() + 1);

      lostQuery.lostDate = { $gte: searchDay, $lt: nextDay };
      foundQuery.foundDate = { $gte: searchDay, $lt: nextDay };
    }

    // General text match keyword
    const searchKeyword = parsedNlp?.keyword || q;
    if (searchKeyword && searchKeyword.trim().length > 0) {
      const regex = new RegExp(searchKeyword.trim(), 'i');
      lostQuery.$or = [
        { title: regex },
        { description: regex },
        { uniqueFeatures: regex },
        { brand: regex },
        { lostLocation: regex },
      ];
      foundQuery.$or = [
        { title: regex },
        { description: regex },
        { uniqueFeatures: regex },
        { brand: regex },
        { foundLocation: regex },
      ];
    }

    let results = [];
    let totalCount = 0;

    if (effectiveType === 'lost') {
      const [lost, total] = await Promise.all([
        LostItem.find(lostQuery)
          .populate('userId', 'name profileImage')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limitNum),
        LostItem.countDocuments(lostQuery),
      ]);
      results = lost.map((item) => ({ ...item.toObject(), itemType: 'lost' }));
      totalCount = total;
    } else if (effectiveType === 'found') {
      const [found, total] = await Promise.all([
        FoundItem.find(foundQuery)
          .populate('finderId', 'name profileImage')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limitNum),
        FoundItem.countDocuments(foundQuery),
      ]);
      results = found.map((item) => ({ ...item.toObject(), itemType: 'found' }));
      totalCount = total;
    } else {
      // Both
      const [lost, found, totalLost, totalFound] = await Promise.all([
        LostItem.find(lostQuery).populate('userId', 'name profileImage').limit(limitNum),
        FoundItem.find(foundQuery).populate('finderId', 'name profileImage').limit(limitNum),
        LostItem.countDocuments(lostQuery),
        FoundItem.countDocuments(foundQuery),
      ]);

      const mappedLost = lost.map((i) => ({ ...i.toObject(), itemType: 'lost' }));
      const mappedFound = found.map((i) => ({ ...i.toObject(), itemType: 'found' }));

      // Merge and sort by createdAt
      results = [...mappedLost, ...mappedFound]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, limitNum);
      totalCount = totalLost + totalFound;
    }

    res.status(200).json({
      success: true,
      data: {
        results,
        parsedNlp,
        appliedFilters: {
          category: effectiveCategory,
          color: effectiveColor,
          brand: effectiveBrand,
          location: effectiveLocation,
          type: effectiveType,
          date: effectiveDate,
        },
        pagination: {
          total: totalCount,
          page: pageNum,
          pages: Math.ceil(totalCount / limitNum),
        },
      },
    });
  } catch (err) {
    next(err);
  }
};
