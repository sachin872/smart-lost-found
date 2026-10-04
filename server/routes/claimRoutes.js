import express from 'express';
import { createClaim, getClaims, getClaimById } from '../controllers/claimController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .post(createClaim)
  .get(getClaims);

router.get('/:id', getClaimById);

export default router;
