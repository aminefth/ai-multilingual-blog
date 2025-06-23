const express = require('express');
const validate = require('../../middlewares/validate');
const auth = require('../../middlewares/auth');
const adminValidation = require('../../validations/admin.validation');
const adminController = require('../../controllers/admin.controller');
const cacheMiddleware = require('../../middlewares/cache');

const router = express.Router();

/**
 * All routes in this file require admin permissions
 */

/**
 * GET /v1/admin/dashboard
 * Get admin dashboard data
 */
router.get(
  '/dashboard',
  auth('admin'),
  cacheMiddleware(300), // Cache for 5 minutes
  adminController.getDashboardData,
);

/**
 * GET /v1/admin/users
 * Get all users with pagination, filtering, and sorting
 */
router.get('/users', auth('admin'), validate(adminValidation.getUsers), adminController.getUsers);

/**
 * PATCH /v1/admin/users/:userId/roles
 * Update user roles
 */
router.patch(
  '/users/:userId/roles',
  auth('admin'),
  validate(adminValidation.updateUserRoles),
  adminController.updateUserRoles,
);

/**
 * GET /v1/admin/approvals
 * Get pending post approvals
 */
router.get('/approvals', auth('admin'), adminController.getPendingApprovals);

/**
 * PATCH /v1/admin/approvals/:postId
 * Approve or reject a blog post
 */
router.patch(
  '/approvals/:postId',
  auth('admin'),
  validate(adminValidation.updateApprovalStatus),
  adminController.updateApprovalStatus,
);

/**
 * GET /v1/admin/settings
 * Get system settings
 */
router.get(
  '/settings',
  auth('admin'),
  cacheMiddleware(3600), // Cache for 1 hour
  adminController.getSystemSettings,
);

/**
 * PATCH /v1/admin/settings
 * Update system settings
 */
router.patch(
  '/settings',
  auth('admin'),
  validate(adminValidation.updateSystemSettings),
  adminController.updateSystemSettings,
);

/**
 * POST /v1/admin/cache/clear
 * Clear system cache
 */
router.post(
  '/cache/clear',
  auth('admin'),
  validate(adminValidation.clearCache),
  adminController.clearCache,
);

module.exports = router;
