import express from 'express';
import { searchItems } from '../controllers/searchController.js';

const router = express.Router();

router.get('/', searchItems);

export default router;
