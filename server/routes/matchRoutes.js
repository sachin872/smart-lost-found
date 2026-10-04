import express from 'express';
import { getMatches, getMatchById, triggerBatchMatch } from '../controllers/matchController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/', getMatches);
router.get('/:id', getMatchById);
router.post('/run', triggerBatchMatch);

export default router;
