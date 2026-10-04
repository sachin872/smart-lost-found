import FoundItem from '../models/FoundItem.js';
import { uploadMultipleImages } from '../services/cloudinaryService.js';
import { matchFoundItemWithLostItems } from '../services/matchingService.js';
import { logAudit } from '../services/auditService.js';

// @desc    Report a Found Item
// @route   POST /api/found
// @access  Private
export const createFoundItem = async (req, res, next) => {
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
      foundLocation,
      latitude,
      longitude,
      foundDate,
      foundTime,
      currentStorageLocation,
    } = req.body;

    if (!title || !description || !category || !foundLocation || !foundDate) {
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

    const foundItem = await FoundItem.create({
      finderId: req.user._id,
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
      foundLocation,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      foundDate: new Date(foundDate),
      foundTime: foundTime || '',
      currentStorageLocation: currentStorageLocation || 'Campus Security Main Office',
    });

    await logAudit({
      user: req.user._id,
      action: 'FOUND_ITEM_REPORTED',
      target: foundItem._id.toString(),
      metadata: { title: foundItem.title, category: foundItem.category },
    });

    // Run AI matching engine against all active lost items
    const matches = await matchFoundItemWithLostItems(foundItem._id);

    res.status(201).json({
      success: true,
      message: 'Found item reported successfully. Evaluated potential lost item matches.',
      data: {
        item: foundItem,
        matchCount: matches.length,
        matches,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all found items (with pagination & filters)
// @route   GET /api/found
// @access  Public
export const getFoundItems = async (req, res, next) => {
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
      query.foundLocation = new RegExp(req.query.location, 'i');
    }
    if (req.query.search) {
      query.$text = { $search: req.query.search };
    }

    const [items, total] = await Promise.all([
      FoundItem.find(query)
        .populate('finderId', 'name profileImage')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      FoundItem.countDocuments(query),
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

// @desc    Get single found item by ID
// @route   GET /api/found/:id
// @access  Public
export const getFoundItemById = async (req, res, next) => {
  try {
    const item = await FoundItem.findById(req.params.id).populate('finderId', 'name profileImage');
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Found item not found',
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

// @desc    Update found item
// @route   PUT /api/found/:id
// @access  Private
export const updateFoundItem = async (req, res, next) => {
  try {
    let item = await FoundItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Found item not found',
        error: 'NOT_FOUND',
      });
    }

    if (item.finderId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to edit this item.',
        error: 'FORBIDDEN',
      });
    }

    if (req.files && req.files.length > 0) {
      const newImages = await uploadMultipleImages(req.files);
      req.body.imageUrls = [...(item.imageUrls || []), ...newImages];
    }

    item = await FoundItem.findByIdAndUpdate(req.params.id, req.body, {
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

// @desc    Delete found item
// @route   DELETE /api/found/:id
// @access  Private
export const deleteFoundItem = async (req, res, next) => {
  try {
    const item = await FoundItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Found item not found',
        error: 'NOT_FOUND',
      });
    }

    if (item.finderId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this item.',
        error: 'FORBIDDEN',
      });
    }

    await item.deleteOne();

    await logAudit({
      user: req.user._id,
      action: 'FOUND_ITEM_DELETED',
      target: req.params.id,
    });

    res.status(200).json({
      success: true,
      message: 'Found item deleted successfully',
      data: {},
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get currently logged-in user's reported found items
// @route   GET /api/found/my
// @access  Private
export const getMyFoundItems = async (req, res, next) => {
  try {
    const items = await FoundItem.find({ finderId: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      data: { items },
    });
  } catch (err) {
    next(err);
  }
};
