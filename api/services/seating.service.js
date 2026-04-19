import { db } from "../config/db.js";
import { sendSeatAssignmentEmail } from "../utils/sendEmail.js";

class AppError extends Error {
  constructor(message, statusCode = 400, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}

/*
|--------------------------------------------------------------------------
| VALIDATION
|--------------------------------------------------------------------------
*/

function validateLocationPayload(payload = {}) {
  const errors = [];

  if (!payload.table_name || !payload.table_name.trim()) {
    errors.push("table_name is required");
  }

  if (!Number.isInteger(payload.capacity) || payload.capacity <= 0) {
    errors.push("capacity must be a positive integer");
  }

  if (errors.length) {
    throw new AppError("Validation failed", 400, errors);
  }
}

function validateAssignmentPayload(payload = {}) {
  const errors = [];

  if (!payload.guest_id) {
    errors.push("guest_id is required");
  }

  if (!payload.seating_table_id) {
    errors.push("seating_table_id is required");
  }

  if (payload.seat_number !== undefined && payload.seat_number !== null) {
    const seat = String(payload.seat_number).trim();
    if (!seat) errors.push("seat_number cannot be blank");
  }

  if (errors.length) {
    throw new AppError("Validation failed", 400, errors);
  }
}

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

async function assertOrganizationEventPermission(client, organizationId, userId) {
  const result = await client.query(
    `
    SELECT role
    FROM organization_members
    WHERE organization_id=$1
      AND user_id=$2
    LIMIT 1
    `,
    [organizationId, userId]
  );

  if (!result.rows[0]) {
    throw new AppError("You do not belong to this organization", 403);
  }

  return result.rows[0];
}

async function assertEventExists(client, eventId, organizationId) {
  const result = await client.query(
    `
    SELECT *
    FROM events
    WHERE id=$1
      AND organization_id=$2
      AND deleted_at IS NULL
    LIMIT 1
    `,
    [eventId, organizationId]
  );

  if (!result.rows[0]) {
    throw new AppError("Event not found", 404);
  }

  return result.rows[0];
}

async function assertGuestBelongsToEvent(client, guestId, eventId) {
  const result = await client.query(
    `
    SELECT *
    FROM guests
    WHERE id=$1
      AND event_id=$2
      AND deleted_at IS NULL
    LIMIT 1
    `,
    [guestId, eventId]
  );

  if (!result.rows[0]) {
    throw new AppError("Guest not found", 404);
  }

  return result.rows[0];
}

async function assertLocationExists(client, locationId, eventId) {
  const result = await client.query(
    `
    SELECT *
    FROM seating_tables
    WHERE id=$1
      AND event_id=$2
      AND deleted_at IS NULL
    LIMIT 1
    `,
    [locationId, eventId]
  );

  if (!result.rows[0]) {
    throw new AppError("Seating location not found", 404);
  }

  return result.rows[0];
}

async function getAssignedCountForLocation(client, locationId) {
  const result = await client.query(
    `
    SELECT COUNT(*)::int AS total
    FROM seating_assignments
    WHERE seating_table_id=$1
    `,
    [locationId]
  );

  return result.rows[0].total;
}

function normalizeSeatNumber(seatNumber) {
  if (seatNumber === undefined || seatNumber === null) return null;
  const value = String(seatNumber).trim();
  return value || null;
}

function mapLocation(row) {
  return {
    id: row.id,
    event_id: row.event_id,
    location_name: row.table_name,
    capacity: row.capacity,
    shape: row.shape,
    position_x: row.position_x,
    position_y: row.position_y,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

/*
|--------------------------------------------------------------------------
| LOCATIONS
|--------------------------------------------------------------------------
*/

export async function createSeatingLocationService({
  eventId,
  organizationId,
  userId,
  payload,
}) {
  validateLocationPayload(payload);

  const client = await db.connect();

  try {
    await client.query("BEGIN");

    await assertOrganizationEventPermission(client, organizationId, userId);
    await assertEventExists(client, eventId, organizationId);

    const result = await client.query(
      `
      INSERT INTO seating_tables
      (
        event_id,
        table_name,
        capacity,
        shape,
        position_x,
        position_y
      )
      VALUES ($1,$2,$3,$4,$5,$6)
      RETURNING *
      `,
      [
        eventId,
        payload.table_name.trim(),
        payload.capacity,
        payload.shape ?? null,
        payload.position_x ?? null,
        payload.position_y ?? null,
      ]
    );

    await client.query("COMMIT");
    return mapLocation(result.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function listSeatingLocationsService({
  eventId,
  organizationId,
  userId,
}) {
  const client = await db.connect();

  try {
    await assertOrganizationEventPermission(client, organizationId, userId);
    await assertEventExists(client, eventId, organizationId);

    const result = await client.query(
      `
      SELECT *
      FROM seating_tables
      WHERE event_id=$1
        AND deleted_at IS NULL
      ORDER BY table_name ASC
      `,
      [eventId]
    );

    return result.rows.map(mapLocation);
  } finally {
    client.release();
  }
}

export async function updateSeatingLocationService({
  eventId,
  locationId,
  organizationId,
  userId,
  payload,
}) {
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    await assertOrganizationEventPermission(client, organizationId, userId);
    await assertEventExists(client, eventId, organizationId);

    const location = await assertLocationExists(client, locationId, eventId);

    const merged = {
      table_name: payload.table_name ?? location.table_name,
      capacity: payload.capacity ?? location.capacity,
      shape: payload.shape ?? location.shape,
      position_x: payload.position_x ?? location.position_x,
      position_y: payload.position_y ?? location.position_y,
    };

    validateLocationPayload(merged);

    const assignedCount = await getAssignedCountForLocation(client, locationId);
    if (merged.capacity < assignedCount) {
      throw new AppError(
        `capacity cannot be lower than current assigned guests (${assignedCount})`,
        400
      );
    }

    const result = await client.query(
      `
      UPDATE seating_tables
      SET
        table_name=$1,
        capacity=$2,
        shape=$3,
        position_x=$4,
        position_y=$5,
        updated_at=NOW()
      WHERE id=$6
      RETURNING *
      `,
      [
        merged.table_name.trim(),
        merged.capacity,
        merged.shape ?? null,
        merged.position_x ?? null,
        merged.position_y ?? null,
        locationId,
      ]
    );

    await client.query("COMMIT");
    return mapLocation(result.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function deleteSeatingLocationService({
  eventId,
  locationId,
  organizationId,
  userId,
}) {
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    await assertOrganizationEventPermission(client, organizationId, userId);
    await assertEventExists(client, eventId, organizationId);
    await assertLocationExists(client, locationId, eventId);

    await client.query(
      `
      UPDATE seating_tables
      SET deleted_at=NOW(), updated_at=NOW()
      WHERE id=$1
      `,
      [locationId]
    );

    await client.query("COMMIT");
    return true;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

/*
|--------------------------------------------------------------------------
| ASSIGNMENTS
|--------------------------------------------------------------------------
*/

// export async function assignGuestSeatService({
//   eventId,
//   organizationId,
//   userId,
//   payload,
// }) {
//   validateAssignmentPayload(payload);

//   const client = await db.connect();

//   try {
//     await client.query("BEGIN");

//     await assertOrganizationEventPermission(client, organizationId, userId);
//     await assertEventExists(client, eventId, organizationId);
//     await assertGuestBelongsToEvent(client, payload.guest_id, eventId);

//     const location = await assertLocationExists(
//       client,
//       payload.seating_table_id,
//       eventId
//     );

//     const assignedCount = await getAssignedCountForLocation(
//       client,
//       payload.seating_table_id
//     );

//     const existingAssignmentRes = await client.query(
//       `
//       SELECT *
//       FROM seating_assignments
//       WHERE event_id=$1 AND guest_id=$2
//       LIMIT 1
//       `,
//       [eventId, payload.guest_id]
//     );

//     const existingAssignment = existingAssignmentRes.rows[0];

//     if (!existingAssignment && assignedCount >= location.capacity) {
//       throw new AppError("Seating location is full", 400);
//     }

//     const seatNumber = normalizeSeatNumber(payload.seat_number);

//     if (seatNumber) {
//       const seatConflictRes = await client.query(
//         `
//         SELECT id
//         FROM seating_assignments
//         WHERE seating_table_id=$1
//           AND seat_number=$2
//           AND id <> COALESCE($3, '00000000-0000-0000-0000-000000000000'::uuid)
//         LIMIT 1
//         `,
//         [payload.seating_table_id, seatNumber, existingAssignment?.id ?? null]
//       );

//       if (seatConflictRes.rows[0]) {
//         throw new AppError("This seat number is already assigned", 409);
//       }
//     }

//     const result = await client.query(
//       `
//       INSERT INTO seating_assignments
//       (
//         event_id,
//         guest_id,
//         seating_table_id,
//         seat_number,
//         created_at,
//         updated_at
//       )
//       VALUES ($1,$2,$3,$4,NOW(),NOW())
//       ON CONFLICT (event_id, guest_id)
//       DO UPDATE SET
//         seating_table_id=EXCLUDED.seating_table_id,
//         seat_number=EXCLUDED.seat_number,
//         updated_at=NOW()
//       RETURNING *
//       `,
//       [eventId, payload.guest_id, payload.seating_table_id, seatNumber]
//     );
//     const result = await client.query(`
//         INSERT INTO seating_assignments
//         (event_id,guest_id,seating_table_id,seat_number)
//         VALUES ($1,$2,$3,$4)
//         RETURNING *
//         `,[
//         eventId,
//         payload.guest_id,
//         payload.seating_table_id,
//         seatNumber
//         ]);

//     await client.query("COMMIT");
//     return result.rows[0];
//   } catch (error) {
//     await client.query("ROLLBACK");
//     throw error;
//   } finally {
//     client.release();
//   }
// }
export async function assignGuestSeatService({
    eventId,
    organizationId,
    userId,
    payload,
  }) {
    validateAssignmentPayload(payload);
  
    const client = await db.connect();
  
    try {
      await client.query("BEGIN");
  
      await assertOrganizationEventPermission(client, organizationId, userId);
      const event = await assertEventExists(client, eventId, organizationId);
      const guest = await assertGuestBelongsToEvent(client, payload.guest_id, eventId);
  
      const location = await assertLocationExists(
        client,
        payload.seating_table_id,
        eventId
      );
  
      const assignedCount = await getAssignedCountForLocation(
        client,
        payload.seating_table_id
      );
  
      const existingAssignmentRes = await client.query(
        `
        SELECT *
        FROM seating_assignments
        WHERE event_id=$1 AND guest_id=$2
        LIMIT 1
        `,
        [eventId, payload.guest_id]
      );
  
      const existingAssignment = existingAssignmentRes.rows[0];
  
      if (!existingAssignment && assignedCount >= location.capacity) {
        throw new AppError("Seating location is full", 400);
      }
  
      const seatNumber = normalizeSeatNumber(payload.seat_number);
  
      /*
      |--------------------------------------------------------------------------
      | SEAT CONFLICT CHECK
      |--------------------------------------------------------------------------
      */
  
      if (seatNumber) {
        const seatConflictRes = await client.query(
          `
          SELECT id
          FROM seating_assignments
          WHERE seating_table_id=$1
            AND seat_number=$2
            AND id <> COALESCE($3, '00000000-0000-0000-0000-000000000000'::uuid)
          LIMIT 1
          `,
          [payload.seating_table_id, seatNumber, existingAssignment?.id ?? null]
        );
  
        if (seatConflictRes.rows[0]) {
          throw new AppError("This seat number is already assigned", 409);
        }
      }
  
      /*
      |--------------------------------------------------------------------------
      | INSERT OR UPDATE ASSIGNMENT
      |--------------------------------------------------------------------------
      */
  
      const result = await client.query(
        `
        INSERT INTO seating_assignments
        (
          event_id,
          guest_id,
          seating_table_id,
          seat_number,
          created_at,
          updated_at
        )
        VALUES ($1,$2,$3,$4,NOW(),NOW())
        ON CONFLICT (event_id, guest_id)
        DO UPDATE SET
          seating_table_id=EXCLUDED.seating_table_id,
          seat_number=EXCLUDED.seat_number,
          updated_at=NOW()
        RETURNING *
        `,
        [eventId, payload.guest_id, payload.seating_table_id, seatNumber]
      );
  
      await client.query("COMMIT");
  
      const assignment = result.rows[0];
  
      /*
      |--------------------------------------------------------------------------
      | OPTIONAL SEAT EMAIL
      |--------------------------------------------------------------------------
      */
  
      if (event.send_seat_email && guest.email) {
        try {
          await sendSeatAssignmentEmail({
            to: guest.email,
            name: guest.full_name,
            eventName: event.name,
            tableName: location.table_name,
            seatNumber: seatNumber,
          });
        } catch (emailError) {
          console.error("Seat email failed:", emailError);
        }
      }
  
      return assignment;
  
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
export async function removeGuestSeatService({
  eventId,
  assignmentId,
  organizationId,
  userId,
}) {
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    await assertOrganizationEventPermission(client, organizationId, userId);
    await assertEventExists(client, eventId, organizationId);

    const result = await client.query(
      `
      DELETE FROM seating_assignments
      WHERE id=$1 AND event_id=$2
      RETURNING id
      `,
      [assignmentId, eventId]
    );

    if (!result.rows[0]) {
      throw new AppError("Seating assignment not found", 404);
    }

    await client.query("COMMIT");
    return true;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function listSeatingAssignmentsService({
  eventId,
  organizationId,
  userId,
}) {
  const client = await db.connect();

  try {
    await assertOrganizationEventPermission(client, organizationId, userId);
    await assertEventExists(client, eventId, organizationId);

    const result = await client.query(
      `
      SELECT
        sa.id,
        sa.event_id,
        sa.guest_id,
        sa.seating_table_id,
        sa.seat_number,
        sa.created_at,
        sa.updated_at,
        g.full_name AS guest_name,
        st.table_name AS location_name
      FROM seating_assignments sa
      JOIN guests g ON g.id = sa.guest_id
      JOIN seating_tables st ON st.id = sa.seating_table_id
      WHERE sa.event_id=$1
        AND g.deleted_at IS NULL
        AND st.deleted_at IS NULL
      ORDER BY st.table_name ASC, sa.seat_number ASC NULLS LAST, g.full_name ASC
      `,
      [eventId]
    );

    return result.rows;
  } finally {
    client.release();
  }
}

export async function getSeatingChartService({
  eventId,
  organizationId,
  userId,
}) {
  const client = await db.connect();

  try {
    await assertOrganizationEventPermission(client, organizationId, userId);
    await assertEventExists(client, eventId, organizationId);

    const locationsRes = await client.query(
      `
      SELECT *
      FROM seating_tables
      WHERE event_id=$1
        AND deleted_at IS NULL
      ORDER BY table_name ASC
      `,
      [eventId]
    );

    const assignmentsRes = await client.query(
      `
      SELECT
        sa.id,
        sa.seating_table_id,
        sa.guest_id,
        sa.seat_number,
        g.full_name
      FROM seating_assignments sa
      JOIN guests g ON g.id = sa.guest_id
      JOIN seating_tables st ON st.id = sa.seating_table_id
      WHERE sa.event_id=$1
        AND g.deleted_at IS NULL
        AND st.deleted_at IS NULL
      ORDER BY sa.seat_number ASC NULLS LAST, g.full_name ASC
      `,
      [eventId]
    );

    const assignmentsByLocation = new Map();

    for (const row of assignmentsRes.rows) {
      if (!assignmentsByLocation.has(row.seating_table_id)) {
        assignmentsByLocation.set(row.seating_table_id, []);
      }

      assignmentsByLocation.get(row.seating_table_id).push({
        assignment_id: row.id,
        guest_id: row.guest_id,
        guest_name: row.full_name,
        seat_number: row.seat_number,
      });
    }

    return locationsRes.rows.map((location) => ({
      id: location.id,
      location_name: location.table_name,
      capacity: location.capacity,
      shape: location.shape,
      position_x: location.position_x,
      position_y: location.position_y,
      assignments: assignmentsByLocation.get(location.id) || [],
    }));
  } finally {
    client.release();
  }
}

/*
|--------------------------------------------------------------------------
| AUTO ASSIGN
|--------------------------------------------------------------------------
*/

export async function autoAssignSeatingService({
  eventId,
  organizationId,
  userId,
  payload = {},
}) {
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    await assertOrganizationEventPermission(client, organizationId, userId);
    await assertEventExists(client, eventId, organizationId);

    const prioritizeVip = Boolean(payload.prioritize_vip ?? true);
    const keepGroupsTogether = Boolean(payload.keep_groups_together ?? true);
    const assignSeatNumbers = Boolean(payload.assign_seat_numbers ?? true);
    const overwriteExisting = Boolean(payload.overwrite_existing ?? false);

    if (overwriteExisting) {
      await client.query(
        `DELETE FROM seating_assignments WHERE event_id=$1`,
        [eventId]
      );
    }

    const locationsRes = await client.query(
      `
      SELECT
        st.*,
        COALESCE((
          SELECT COUNT(*)
          FROM seating_assignments sa
          WHERE sa.seating_table_id=st.id
        ), 0)::int AS current_assigned
      FROM seating_tables st
      WHERE st.event_id=$1
        AND st.deleted_at IS NULL
      ORDER BY st.capacity DESC, st.table_name ASC
      `,
      [eventId]
    );

    const locations = locationsRes.rows.map((row) => ({
      id: row.id,
      name: row.table_name,
      capacity: row.capacity,
      current_assigned: row.current_assigned,
      remaining: row.capacity - row.current_assigned,
    }));

    if (!locations.length) {
      throw new AppError("No seating locations found for this event", 400);
    }

    const guestsRes = await client.query(
      `
      SELECT
        g.id,
        g.full_name,
        g.is_vip,
        gg.id AS group_id,
        gg.group_name
      FROM guests g
      LEFT JOIN guest_groups gg
        ON gg.id = g.guest_group_id
       AND gg.event_id = g.event_id
       AND gg.deleted_at IS NULL
      WHERE g.event_id=$1
        AND g.deleted_at IS NULL
        AND (
          $2::boolean = true
          OR NOT EXISTS (
            SELECT 1
            FROM seating_assignments sa
            WHERE sa.event_id=g.event_id AND sa.guest_id=g.id
          )
        )
      ORDER BY g.is_vip DESC, g.full_name ASC
      `,
      [eventId, overwriteExisting]
    );

    const guests = guestsRes.rows;

    if (!guests.length) {
      await client.query("COMMIT");
      return {
        assigned_count: 0,
        unassigned_count: 0,
        assignments: [],
        skipped_reason: "No guests to assign",
      };
    }

    const totalRemainingCapacity = locations.reduce(
      (sum, loc) => sum + Math.max(loc.remaining, 0),
      0
    );

    if (totalRemainingCapacity < guests.length) {
      throw new AppError(
        `Not enough seating capacity. Need ${guests.length}, available ${totalRemainingCapacity}`,
        400
      );
    }

    let units = [];

    if (keepGroupsTogether) {
      const grouped = new Map();

      for (const guest of guests) {
        const key = guest.group_id || `single:${guest.id}`;

        if (!grouped.has(key)) {
          grouped.set(key, {
            key,
            group_id: guest.group_id || null,
            group_name: guest.group_name || null,
            guests: [],
            vip_count: 0,
          });
        }

        const entry = grouped.get(key);
        entry.guests.push(guest);
        if (guest.is_vip) entry.vip_count += 1;
      }

      units = Array.from(grouped.values());
    } else {
      units = guests.map((guest) => ({
        key: `single:${guest.id}`,
        group_id: guest.group_id || null,
        group_name: guest.group_name || null,
        guests: [guest],
        vip_count: guest.is_vip ? 1 : 0,
      }));
    }

    units.sort((a, b) => {
      if (prioritizeVip && b.vip_count !== a.vip_count) {
        return b.vip_count - a.vip_count;
      }

      if (b.guests.length !== a.guests.length) {
        return b.guests.length - a.guests.length;
      }

      return a.key.localeCompare(b.key);
    });

    const createdAssignments = [];

    for (const unit of units) {
      let chosenLocation = null;

      for (const location of locations) {
        if (location.remaining >= unit.guests.length) {
          chosenLocation = location;
          break;
        }
      }

      if (!chosenLocation) {
        throw new AppError(
          `Unable to place ${unit.group_name || "some guests"} with current capacity`,
          400
        );
      }

      let startSeat = chosenLocation.current_assigned + 1;

      for (const guest of unit.guests) {
        const seatNumber = assignSeatNumbers ? String(startSeat) : null;

        const insertRes = await client.query(
          `
          INSERT INTO seating_assignments
          (
            event_id,
            guest_id,
            seating_table_id,
            seat_number,
            created_at,
            updated_at
          )
          VALUES ($1,$2,$3,$4,NOW(),NOW())
          ON CONFLICT (event_id, guest_id)
          DO UPDATE SET
            seating_table_id=EXCLUDED.seating_table_id,
            seat_number=EXCLUDED.seat_number,
            updated_at=NOW()
          RETURNING *
          `,
          [eventId, guest.id, chosenLocation.id, seatNumber]
        );

        createdAssignments.push(insertRes.rows[0]);
        chosenLocation.current_assigned += 1;
        chosenLocation.remaining -= 1;
        startSeat += 1;
      }
    }

    await client.query("COMMIT");

    return {
      assigned_count: createdAssignments.length,
      unassigned_count: 0,
      assignments: createdAssignments,
      options: {
        prioritize_vip: prioritizeVip,
        keep_groups_together: keepGroupsTogether,
        assign_seat_numbers: assignSeatNumbers,
        overwrite_existing: overwriteExisting,
      },
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function clearSeatingAssignmentsService({
  eventId,
  organizationId,
  userId,
}) {
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    await assertOrganizationEventPermission(client, organizationId, userId);
    await assertEventExists(client, eventId, organizationId);

    const result = await client.query(
      `
      DELETE FROM seating_assignments
      WHERE event_id=$1
      `,
      [eventId]
    );

    await client.query("COMMIT");

    return {
      deleted_count: result.rowCount,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}