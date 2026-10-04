import express from 'express';
import {
  createHandover,
  verifyHandover,
  getHandoverById,
  getHandovers,
} from '../controllers/handoverController.js';
import { protect } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/admin.js';
import { otpLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getHandovers)
  .post(requireAdmin, createHandover);

router.post('/verify', otpLimiter, verifyHandover);
router.get('/:id', getHandoverById);

export default router;
