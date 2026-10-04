import express from 'express';
import { getProfile, updateProfile } from '../controllers/userController.js';
import { protect } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

router.use(protect);

router.get('/profile', getProfile);
router.put('/profile', upload.single('profileImage'), updateProfile);

export default router;
