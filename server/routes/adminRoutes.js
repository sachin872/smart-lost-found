import express from 'express';
import {
  getAdminDashboardStats,
  getAdminUsers,
  toggleBlockUser,
  approveClaim,
  rejectClaim,
  requestClaimInfo,
  getAuditLogs,
} from '../controllers/adminController.js';
import { protect } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/admin.js';

const router = express.Router();

// Require both authentication and admin role
router.use(protect, requireAdmin);

router.get('/dashboard', getAdminDashboardStats);
router.get('/users', getAdminUsers);
router.put('/users/:id/status', toggleBlockUser);
router.put('/claims/:id/approve', approveClaim);
router.put('/claims/:id/reject', rejectClaim);
router.put('/claims/:id/request-info', requestClaimInfo);
router.get('/audit-logs', getAuditLogs);

export default router;
