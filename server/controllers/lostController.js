import LostItem from '../models/LostItem.js';
import { uploadMultipleImages } from '../services/cloudinaryService.js';
import { matchLostItemWithFoundItems } from '../services/matchingService.js';
import { logAudit } from '../services/auditService.js';

// @desc    Report a Lost Item
// @route   POST /api/lost
// @access  Private
export const createLostItem = async (req, res, next) => {
  try {
    const {
      title,
      description,
      category,
      subcategory,
      brand,
      color,
      condition,
      serialNumber,
      uniqueFeatures,
      lostLocation,
      latitude,
      longitude,
      lostDate,
      lostTime,
    } = req.body;

    if (!title || !description || !category || !lostLocation || !lostDate) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: title, description, category, location, and date.',
        error: 'MISSING_REQUIRED_FIELDS',
      });
    }

    // Process image uploads
    let imageUrls = [];
    if (req.files && req.files.length > 0) {
      imageUrls = await uploadMultipleImages(req.files);
    } else if (req.body.imageUrls) {
      imageUrls = Array.isArray(req.body.imageUrls) ? req.body.imageUrls : [req.body.imageUrls];
    }

    const lostItem = await LostItem.create({
      userId: req.user._id,
      title,
      description,
      category,
      subcategory: subcategory || '',
      brand: brand || '',
      color: color || '',
      condition: condition || 'Good',
      serialNumber: serialNumber || '',
      uniqueFeatures: uniqueFeatures || '',
      imageUrls,
      lostLocation,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      lostDate: new Date(lostDate),
      lostTime: lostTime || '',
    });

    await logAudit({
      user: req.user._id,
      action: 'LOST_ITEM_REPORTED',
      target: lostItem._id.toString(),
      metadata: { title: lostItem.title, category: lostItem.category },
    });

    // Run AI matching engine asynchronously against all active found items
    const matches = await matchLostItemWithFoundItems(lostItem._id);

    res.status(201).json({
      success: true,
      message: 'Lost item reported successfully. Matching engine evaluated found records.',
      data: {
        item: lostItem,
        matchCount: matches.length,
        matches,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all lost items (with pagination & filters)
// @route   GET /api/lost
// @access  Public
export const getLostItems = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 12;
    const skip = (page - 1) * limit;

    const query = {};

    if (req.query.category && req.query.category !== 'All') {
      query.category = req.query.category;
    }
    if (req.query.status && req.query.status !== 'All') {
      query.status = req.query.status;
    }
    if (req.query.color) {
      query.color = new RegExp(req.query.color, 'i');
    }
    if (req.query.location) {
      query.lostLocation = new RegExp(req.query.location, 'i');
    }
    if (req.query.search) {
      query.$text = { $search: req.query.search };
    }

    const [items, total] = await Promise.all([
      LostItem.find(query)
        .populate('userId', 'name profileImage') // Privacy: avoid exposing email/phone publicly
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      LostItem.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: {
        items,
        pagination: {
          total,
          page,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single lost item by ID
// @route   GET /api/lost/:id
// @access  Public
export const getLostItemById = async (req, res, next) => {
  try {
    const item = await LostItem.findById(req.params.id).populate('userId', 'name profileImage');
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Lost item not found',
        error: 'NOT_FOUND',
      });
    }

    res.status(200).json({
      success: true,
      data: { item },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update lost item
// @route   PUT /api/lost/:id
// @access  Private
export const updateLostItem = async (req, res, next) => {
  try {
    let item = await LostItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Lost item not found',
        error: 'NOT_FOUND',
      });
    }

    // Only owner or admin can update
    if (item.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to edit this item.',
        error: 'FORBIDDEN',
      });
    }

    // Process new images if uploaded
    if (req.files && req.files.length > 0) {
      const newImages = await uploadMultipleImages(req.files);
      req.body.imageUrls = [...(item.imageUrls || []), ...newImages];
    }

    item = await LostItem.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: 'Item updated successfully',
      data: { item },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete lost item
// @route   DELETE /api/lost/:id
// @access  Private
export const deleteLostItem = async (req, res, next) => {
  try {
    const item = await LostItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Lost item not found',
        error: 'NOT_FOUND',
      });
    }

    if (item.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this item.',
        error: 'FORBIDDEN',
      });
    }

    await item.deleteOne();

    await logAudit({
      user: req.user._id,
      action: 'LOST_ITEM_DELETED',
      target: req.params.id,
    });

    res.status(200).json({
      success: true,
      message: 'Lost item deleted successfully',
      data: {},
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get currently logged-in user's reported lost items
// @route   GET /api/lost/my
// @access  Private
export const getMyLostItems = async (req, res, next) => {
  try {
    const items = await LostItem.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      data: { items },
    });
  } catch (err) {
    next(err);
  }
};
