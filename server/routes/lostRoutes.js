import express from 'express';
import {
  createLostItem,
  getLostItems,
  getLostItemById,
  updateLostItem,
  deleteLostItem,
  getMyLostItems,
} from '../controllers/lostController.js';
import { protect } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

router.route('/')
  .get(getLostItems)
  .post(protect, upload.array('images', 5), createLostItem);

router.get('/my', protect, getMyLostItems);

router.route('/:id')
  .get(getLostItemById)
  .put(protect, upload.array('images', 5), updateLostItem)
  .delete(protect, deleteLostItem);

export default router;
