import AuditLog from '../models/AuditLog.js';

export async function logAudit({ user = null, action, target = '', metadata = {} }) {
  try {
    await AuditLog.create({
      user,
      action,
      target,
      metadata,
    });
  } catch (err) {
    console.error('Audit log creation failed:', err.message);
  }
}
