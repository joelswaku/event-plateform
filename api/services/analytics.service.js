import { db } from "../config/db.js";

class AppError extends Error {
  constructor(message, statusCode = 400, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}

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

export async function getEventAnalyticsDashboardService({
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
      WITH order_stats AS (
        SELECT
          COUNT(*)::int AS total_orders,
          COUNT(*) FILTER (WHERE payment_status='PAID')::int AS paid_orders,
          COUNT(*) FILTER (WHERE payment_status='PENDING')::int AS pending_orders,
          COUNT(*) FILTER (WHERE payment_status='FAILED')::int AS failed_orders,
          COALESCE(SUM(total) FILTER (WHERE payment_status='PAID'), 0)::numeric(12,2) AS gross_revenue
        FROM ticket_orders
        WHERE event_id=$1
          AND deleted_at IS NULL
      ),
      issued_stats AS (
        SELECT
          COUNT(*)::int AS tickets_issued,
          COUNT(*) FILTER (WHERE qr_status='ACTIVE')::int AS active_tickets,
          COUNT(*) FILTER (WHERE qr_status='USED')::int AS used_tickets,
          COUNT(*) FILTER (WHERE qr_status='REVOKED')::int AS revoked_tickets
        FROM issued_tickets
        WHERE event_id=$1
      ),
      scan_stats AS (
        SELECT
          COUNT(*) FILTER (WHERE scan_result='SUCCESS')::int AS successful_scans,
          COUNT(*) FILTER (WHERE scan_result='ALREADY_USED')::int AS duplicate_scans,
          COUNT(*) FILTER (WHERE scan_result='INVALID')::int AS invalid_scans,
          COUNT(*) FILTER (WHERE scan_result='REVOKED')::int AS revoked_scans
        FROM ticket_scans
        WHERE event_id=$1
      ),
      ticket_type_stats AS (
        SELECT
          COUNT(*)::int AS ticket_types_count,
          COALESCE(SUM(quantity_total), 0)::int AS total_inventory,
          COALESCE(SUM(quantity_sold), 0)::int AS total_sold_inventory
        FROM ticket_types
        WHERE event_id=$1
          AND deleted_at IS NULL
      )
      SELECT *
      FROM order_stats
      CROSS JOIN issued_stats
      CROSS JOIN scan_stats
      CROSS JOIN ticket_type_stats
      `,
      [eventId]
    );

    const row = result.rows[0];

    return {
      orders: {
        total_orders: Number(row.total_orders),
        paid_orders: Number(row.paid_orders),
        pending_orders: Number(row.pending_orders),
        failed_orders: Number(row.failed_orders),
      },
      revenue: {
        gross_revenue: Number(row.gross_revenue),
      },
      tickets: {
        ticket_types_count: Number(row.ticket_types_count),
        total_inventory: Number(row.total_inventory),
        total_sold_inventory: Number(row.total_sold_inventory),
        tickets_issued: Number(row.tickets_issued),
        active_tickets: Number(row.active_tickets),
        used_tickets: Number(row.used_tickets),
        revoked_tickets: Number(row.revoked_tickets),
      },
      scans: {
        successful_scans: Number(row.successful_scans),
        duplicate_scans: Number(row.duplicate_scans),
        invalid_scans: Number(row.invalid_scans),
        revoked_scans: Number(row.revoked_scans),
      },
    };
  } finally {
    client.release();
  }
}

export async function getTicketSalesAnalyticsService({
  eventId,
  organizationId,
  userId,
}) {
  const client = await db.connect();

  try {
    await assertOrganizationEventPermission(client, organizationId, userId);
    await assertEventExists(client, eventId, organizationId);

    const byTypeRes = await client.query(
      `
      SELECT
        tt.id AS ticket_type_id,
        tt.name AS ticket_type_name,
        tt.kind,
        tt.price,
        tt.quantity_total,
        tt.quantity_sold,
        COALESCE(SUM(toi.quantity) FILTER (WHERE o.payment_status='PAID'), 0)::int AS paid_quantity,
        COALESCE(SUM(toi.line_total) FILTER (WHERE o.payment_status='PAID'), 0)::numeric(12,2) AS paid_revenue
      FROM ticket_types tt
      LEFT JOIN ticket_order_items toi ON toi.ticket_type_id = tt.id
      LEFT JOIN ticket_orders o ON o.id = toi.order_id
      WHERE tt.event_id=$1
        AND tt.deleted_at IS NULL
      GROUP BY tt.id
      ORDER BY tt.name ASC
      `,
      [eventId]
    );

    const timelineRes = await client.query(
      `
      SELECT
        date_trunc('hour', created_at) AS bucket,
        COUNT(*)::int AS orders_count,
        COALESCE(SUM(total) FILTER (WHERE payment_status='PAID'), 0)::numeric(12,2) AS paid_revenue
      FROM ticket_orders
      WHERE event_id=$1
        AND deleted_at IS NULL
      GROUP BY bucket
      ORDER BY bucket ASC
      `,
      [eventId]
    );

    return {
      by_ticket_type: byTypeRes.rows.map((row) => ({
        ticket_type_id: row.ticket_type_id,
        ticket_type_name: row.ticket_type_name,
        kind: row.kind,
        price: Number(row.price),
        quantity_total: row.quantity_total === null ? null : Number(row.quantity_total),
        quantity_sold: Number(row.quantity_sold),
        paid_quantity: Number(row.paid_quantity),
        paid_revenue: Number(row.paid_revenue),
      })),
      timeline: timelineRes.rows.map((row) => ({
        bucket: row.bucket,
        orders_count: Number(row.orders_count),
        paid_revenue: Number(row.paid_revenue),
      })),
    };
  } finally {
    client.release();
  }
}

export async function getTicketCheckinAnalyticsService({
  eventId,
  organizationId,
  userId,
}) {
  const client = await db.connect();

  try {
    await assertOrganizationEventPermission(client, organizationId, userId);
    await assertEventExists(client, eventId, organizationId);

    const summaryRes = await client.query(
      `
      SELECT
        COUNT(*) FILTER (WHERE scan_result='SUCCESS')::int AS success,
        COUNT(*) FILTER (WHERE scan_result='ALREADY_USED')::int AS already_used,
        COUNT(*) FILTER (WHERE scan_result='INVALID')::int AS invalid,
        COUNT(*) FILTER (WHERE scan_result='REVOKED')::int AS revoked
      FROM ticket_scans
      WHERE event_id=$1
      `,
      [eventId]
    );

    const byHourRes = await client.query(
      `
      SELECT
        date_trunc('hour', created_at) AS bucket,
        COUNT(*) FILTER (WHERE scan_result='SUCCESS')::int AS successful_scans
      FROM ticket_scans
      WHERE event_id=$1
      GROUP BY bucket
      ORDER BY bucket ASC
      `,
      [eventId]
    );

    const byDeviceRes = await client.query(
      `
      SELECT
        ts.device_id,
        COUNT(*)::int AS scans_count
      FROM ticket_scans ts
      WHERE ts.event_id=$1
      GROUP BY ts.device_id
      ORDER BY scans_count DESC
      `,
      [eventId]
    );

    return {
      summary: {
        success: Number(summaryRes.rows[0]?.success || 0),
        already_used: Number(summaryRes.rows[0]?.already_used || 0),
        invalid: Number(summaryRes.rows[0]?.invalid || 0),
        revoked: Number(summaryRes.rows[0]?.revoked || 0),
      },
      by_hour: byHourRes.rows.map((row) => ({
        bucket: row.bucket,
        successful_scans: Number(row.successful_scans),
      })),
      by_device: byDeviceRes.rows.map((row) => ({
        device_id: row.device_id,
        scans_count: Number(row.scans_count),
      })),
    };
  } finally {
    client.release();
  }
}

export async function getScannerDashboardService({
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
      WITH ticket_stats AS (
        SELECT
          COUNT(*)::int AS total_issued,
          COUNT(*) FILTER (WHERE qr_status='USED')::int AS checked_in,
          COUNT(*) FILTER (WHERE qr_status='ACTIVE')::int AS remaining
        FROM issued_tickets
        WHERE event_id=$1
      ),
      scan_stats AS (
        SELECT
          COUNT(*) FILTER (WHERE scan_result='SUCCESS')::int AS success,
          COUNT(*) FILTER (WHERE scan_result='ALREADY_USED')::int AS duplicate,
          COUNT(*) FILTER (WHERE scan_result='INVALID')::int AS invalid
        FROM ticket_scans
        WHERE event_id=$1
      )
      SELECT *
      FROM ticket_stats
      CROSS JOIN scan_stats
      `,
      [eventId]
    );

    const row = result.rows[0];

    return {
      total_issued: Number(row.total_issued),
      checked_in: Number(row.checked_in),
      remaining: Number(row.remaining),
      scan_success: Number(row.success),
      scan_duplicate: Number(row.duplicate),
      scan_invalid: Number(row.invalid),
    };
  } finally {
    client.release();
  }
}

export async function getRevenueTimelineService({
  eventId,
  organizationId,
  userId,
  interval = "day", // hour | day | month
}) {
  const client = await db.connect();

  try {
    await assertOrganizationEventPermission(client, organizationId, userId);
    await assertEventExists(client, eventId, organizationId);

    const result = await client.query(
      `
      SELECT
        date_trunc($2, created_at) AS bucket,
        COUNT(*)::int AS orders_count,
        COALESCE(SUM(total) FILTER (WHERE payment_status='PAID'), 0)::numeric(12,2) AS revenue
      FROM ticket_orders
      WHERE event_id=$1
        AND deleted_at IS NULL
      GROUP BY bucket
      ORDER BY bucket ASC
      `,
      [eventId, interval]
    );

    return result.rows.map((row) => ({
      bucket: row.bucket,
      orders: Number(row.orders_count),
      revenue: Number(row.revenue),
    }));
  } finally {
    client.release();
  }
}

export async function getConversionAnalyticsService({
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
      WITH invited AS (
        SELECT COUNT(*)::int AS total_invited
        FROM guests
        WHERE event_id=$1
      ),
      attending AS (
        SELECT COUNT(*)::int AS total_attending
        FROM guest_rsvps
        WHERE event_id=$1
          AND rsvp_status='GOING'
      ),
      buyers AS (
        SELECT COUNT(DISTINCT buyer_email)::int AS total_buyers
        FROM ticket_orders
        WHERE event_id=$1
          AND payment_status='PAID'
      )
      SELECT *
      FROM invited
      CROSS JOIN attending
      CROSS JOIN buyers
      `,
      [eventId]
    );

    const row = result.rows[0];

    return {
      invited: Number(row.total_invited),
      attending: Number(row.total_attending),
      buyers: Number(row.total_buyers),
      conversion_rate:
        row.total_invited > 0
          ? (row.total_buyers / row.total_invited) * 100
          : 0,
    };
  } finally {
    client.release();
  }
}

export async function getEventInsightsService({
  eventId,
  organizationId,
  userId,
}) {
  const client = await db.connect();

  try {
    await assertOrganizationEventPermission(client, organizationId, userId);
    await assertEventExists(client, eventId, organizationId);

    /*
    TOP SELLING TICKET
    */
    const topTicket = await client.query(
      `
      SELECT
        tt.name,
        SUM(toi.quantity) AS sold
      FROM ticket_order_items toi
      JOIN ticket_types tt ON tt.id = toi.ticket_type_id
      JOIN ticket_orders o ON o.id = toi.order_id
      WHERE tt.event_id=$1
        AND o.payment_status='PAID'
      GROUP BY tt.name
      ORDER BY sold DESC
      LIMIT 1
      `,
      [eventId]
    );

    /*
    PEAK HOUR
    */
    const peakHour = await client.query(
      `
      SELECT
        EXTRACT(HOUR FROM created_at) AS hour,
        COUNT(*) AS orders
      FROM ticket_orders
      WHERE event_id=$1
      GROUP BY hour
      ORDER BY orders DESC
      LIMIT 1
      `,
      [eventId]
    );

    return {
      top_ticket: topTicket.rows[0] || null,
      peak_hour: peakHour.rows[0] || null,
    };
  } finally {
    client.release();
  }
}