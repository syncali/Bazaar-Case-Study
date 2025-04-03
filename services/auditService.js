/**
 * Audit logging service
 * Stub implementation that logs audit information
 */

/**
 * Create an audit log entry
 * @param {Object} params - Audit log parameters
 * @param {string} params.userId - User who performed the action
 * @param {string} params.actionType - Type of action performed
 * @param {string} params.entityType - Type of entity affected
 * @param {number|string} params.entityId - ID of entity affected
 * @param {Object} params.details - Additional details about the action
 * @param {Object} [params.transaction] - Optional sequelize transaction
 * @returns {Promise<void>}
 */
async function createAuditLog({ userId, actionType, entityType, entityId, details, transaction }) {
  // Logging User actions to the console
  console.log(
    `[AUDIT] User ${userId} performed ${actionType} on ${entityType} ${entityId}`,
    details
  );

  return Promise.resolve();
}

module.exports = { createAuditLog };
