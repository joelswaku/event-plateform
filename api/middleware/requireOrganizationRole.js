import { db } from "../config/db.js";

export function requireOrganizationRole(allowedRoles = []) {
  return async function (req, res, next) {
    try {
      const userId = req.user.id;
      const organizationId = req.params.organizationId || req.body.organization_id;

      const { rows } = await db.query(
        `
        SELECT role
        FROM organization_members
        WHERE organization_id=$1
        AND user_id=$2
        AND deleted_at IS NULL
        `,
        [organizationId, userId]
      );

      if (!rows.length) {
        return res.status(403).json({
          success: false,
          message: "Not a member of this organization",
        });
      }

      const role = rows[0].role;

      if (!allowedRoles.includes(role)) {
        return res.status(403).json({
          success: false,
          message: "Insufficient organization permissions",
        });
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}