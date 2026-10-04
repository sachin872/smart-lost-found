import express from 'express';
import {
  createFoundItem,
  getFoundItems,
  getFoundItemById,
  updateFoundItem,
  deleteFoundItem,
  getMyFoundItems,
} from '../controllers/foundController.js';
import { protect } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

router.route('/')
  .get(getFoundItems)
  .post(protect, upload.array('images', 5), createFoundItem);

router.get('/my', protect, getMyFoundItems);

router.route('/:id')
  .get(getFoundItemById)
  .put(protect, upload.array('images', 5), updateFoundItem)
  .delete(protect, deleteFoundItem);

export default router;
