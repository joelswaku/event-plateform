import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireSuperAdmin } from '../middleware/role.middleware.js';
import {
  submitReview,
  getApprovedReviews,
  getAllReviews,
  approveReview,
  rejectReview,
  deleteReview
} from '../controllers/reviews.controller.js';

const router = express.Router();

// Public routes
router.get('/approved', getApprovedReviews);

// Protected routes (authenticated users)
router.post('/', authenticate, submitReview);

// Admin routes (super admin only)
router.get('/admin/all', authenticate, requireSuperAdmin, getAllReviews);
router.patch('/:id/approve', authenticate, requireSuperAdmin, approveReview);
router.patch('/:id/reject', authenticate, requireSuperAdmin, rejectReview);
router.delete('/:id', authenticate, requireSuperAdmin, deleteReview);

export default router;
