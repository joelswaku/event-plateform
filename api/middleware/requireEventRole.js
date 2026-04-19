// import { db } from "../config/db.js";

// export function requireEventContentRole(allowedRoles = []) {
//   return async (req, res, next) => {
//     try {
//       const userId = req.user?.id;
//       const eventId = req.params.eventId || req.body.event_id;

//       if (!userId) {
//         return res.status(401).json({
//           success: false,
//           message: "Unauthorized",
//         });
//       }

//       if (!eventId) {
//         return res.status(400).json({
//           success: false,
//           message: "eventId is required",
//         });
//       }

//       const result = await db.query(
//         `
//         SELECT role
//         FROM event_members
//         WHERE event_id = $1
//           AND user_id = $2
//           AND deleted_at IS NULL
//         LIMIT 1
//         `,
//         [eventId, userId]
//       );

//       if (!result.rows.length) {
//         return res.status(403).json({
//           success: false,
//           message: "You do not have access to this event",
//         });
//       }

//       const role = String(result.rows[0].role).toUpperCase();

//       if (!allowedRoles.includes(role)) {
//         return res.status(403).json({
//           success: false,
//           message: "You do not have permission to edit event content",
//         });
//       }

//       next();
//     } catch (error) {
//       next(error);
//     }
//   };
// }







import { db } from "../config/db.js";

export function requireEventRole(allowedRoles = []) {
  return async function (req, res, next) {
    try {
      const userId = req.user.id;
      const eventId = req.params.eventId || req.body.event_id;

      const { rows } = await db.query(
        `
        SELECT role
        FROM event_members
        WHERE event_id=$1
        AND user_id=$2
        AND deleted_at IS NULL
        `,
        [eventId, userId]
      );

      if (!rows.length) {
        return res.status(403).json({
          success: false,
          message: "No access to this event",
        });
      }

      const role = rows[0].role;

      if (!allowedRoles.includes(role)) {
        return res.status(403).json({
          success: false,
          message: "Insufficient event permissions",
        });
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}