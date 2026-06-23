import { db } from "../config/db.js";
import { callAI, logAIGeneration } from "./ai.service.js";

export class AppError extends Error {
  constructor(message, statusCode = 400, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}

// 1. Generate Event Content
export async function generateEventContentService({ organizationId, userId, eventId, eventType, title, venue, date, tone, keywords }) {
  const system = `You are an expert event copywriter. Return ONLY valid JSON.`;
  const user = `Generate compelling event content for:
Event Type: ${eventType || "General Event"}
Title: ${title || "Untitled Event"}
Venue: ${venue || "TBD"}
Date: ${date || "TBD"}
Tone: ${tone || "professional"}
Keywords: ${keywords || ""}

Return JSON with this exact shape:
{
  "improvedTitle": "...",
  "shortDescription": "...",
  "fullDescription": "...",
  "ctaText": "...",
  "ctaSubtext": "...",
  "seoKeywords": ["..."],
  "hashtags": ["..."]
}`;

  const { content, usage, latencyMs } = await callAI({ feature: "event_content", systemPrompt: system, userPrompt: user, responseFormat: "json", maxTokens: 1500 });
  logAIGeneration({ organizationId, userId, eventId, feature: "event_content", usage, inputSnapshot: user.slice(0, 500), outputSnapshot: JSON.stringify(content).slice(0, 500), latencyMs });
  return content;
}

// 2. Generate Builder Page
export async function generateBuilderPageService({ organizationId, userId, eventId, styleInstruction, tone }) {
  let eventContext = "";
  if (eventId) {
    const { rows } = await db.query("SELECT title, description, event_type, starts_at FROM events WHERE id = $1", [eventId]);
    if (rows[0]) eventContext = `Event: ${rows[0].title}, Type: ${rows[0].event_type}, Date: ${rows[0].starts_at}`;
  }

  const system = `You are an expert event page designer. Return ONLY valid JSON.`;
  const user = `Design a complete event landing page layout.
Style instruction: "${styleInstruction}"
Tone: ${tone || "modern"}
${eventContext}

Return JSON:
{
  "theme": "...",
  "colorPalette": { "primary": "#...", "secondary": "#...", "background": "#...", "text": "#..." },
  "fontSuggestion": "...",
  "designNotes": "...",
  "sections": [
    {
      "type": "hero|countdown|about|schedule|speakers|tickets|gallery|faq|venue|cta",
      "title": "...",
      "body": "...",
      "config": {}
    }
  ]
}`;

  const { content, usage, latencyMs } = await callAI({ feature: "builder_page", systemPrompt: system, userPrompt: user, responseFormat: "json", maxTokens: 3000 });
  logAIGeneration({ organizationId, userId, eventId, feature: "builder_page", usage, inputSnapshot: user.slice(0, 500), outputSnapshot: JSON.stringify(content).slice(0, 500), latencyMs });
  return content;
}

// 3. Generate Ticket Pricing
export async function generateTicketPricingService({ organizationId, userId, eventId, capacity, targetRevenue, eventType, duration, venueQuality, city, country, ticketName, kind }) {
  let existingTiers = [];
  let eventRow = {};
  if (eventId) {
    const [tiersRes, eventRes] = await Promise.all([
      db.query("SELECT name, price, quantity_total FROM ticket_types WHERE event_id = $1", [eventId]),
      db.query("SELECT title, event_type, capacity, starts_at, venue_name, city, country FROM events WHERE id = $1", [eventId]),
    ]);
    existingTiers = tiersRes.rows;
    eventRow = eventRes.rows[0] ?? {};
  }

  const resolvedEventType = eventType || eventRow.event_type || "general";
  const resolvedCapacity = capacity || eventRow.capacity || "unknown";
  const resolvedCity = city || eventRow.city || "";
  const resolvedCountry = country || eventRow.country || "";

  const system = `You are an expert event pricing strategist. Return ONLY valid JSON.`;
  const user = `Design an optimal ticket pricing strategy:
Event: ${eventRow.title || "Event"}
Event Type: ${resolvedEventType}
Ticket Being Priced: ${ticketName || "General Admission"} (kind: ${kind || "paid"})
Capacity: ${resolvedCapacity}
Target Revenue: ${targetRevenue || "not specified"}
Duration: ${duration || "1 day"}
Venue Quality: ${venueQuality || "standard"}
Location: ${resolvedCity}, ${resolvedCountry}
Existing tiers: ${JSON.stringify(existingTiers)}

Return JSON:
{
  "strategySummary": "...",
  "tiers": [
    {
      "name": "...",
      "price": 0,
      "quantity": 0,
      "benefits": ["..."],
      "tierType": "early_bird|general|vip|premium",
      "salesWindow": "..."
    }
  ],
  "pricingRationale": "...",
  "revenueProjections": { "low": 0, "mid": 0, "high": 0 },
  "urgencyTactics": ["..."]
}`;

  const { content, usage, latencyMs } = await callAI({ feature: "ticket_pricing", systemPrompt: system, userPrompt: user, responseFormat: "json", maxTokens: 2000 });
  logAIGeneration({ organizationId, userId, eventId, feature: "ticket_pricing", usage, inputSnapshot: user.slice(0, 500), outputSnapshot: JSON.stringify(content).slice(0, 500), latencyMs });
  return content;
}

// 4. Analyze Guest List
export async function analyzeGuestListService({ organizationId, userId, eventId }) {
  if (!eventId) throw new AppError("eventId required", 400);

  const [eventRes, guestRes] = await Promise.all([
    db.query("SELECT title, starts_at, event_type FROM events WHERE id = $1", [eventId]),
    db.query(`
      SELECT g.id, g.full_name AS name, g.email, g.rsvp_status, g.is_vip,
             ga.marked_at AS checked_in_at, ga.attendance_status, g.group_name
      FROM guests g
      LEFT JOIN guest_attendance ga ON ga.guest_id = g.id AND ga.event_id = g.event_id
      WHERE g.event_id = $1
    `, [eventId]),
  ]);

  const event = eventRes.rows[0] ?? {};
  const guests = guestRes.rows;

  const system = `You are an expert event analytics AI. Return ONLY valid JSON.`;
  const user = `Analyze this guest list for "${event.title}" (${event.event_type}):
Total Guests: ${guests.length}
RSVP Breakdown: ${JSON.stringify(
    guests.reduce((acc, g) => { acc[g.rsvp_status] = (acc[g.rsvp_status] || 0) + 1; return acc; }, {})
  )}
VIP Count: ${guests.filter(g => g.is_vip).length}
Checked In: ${guests.filter(g => g.attendance_status === 'CHECKED_IN' || g.attendance_status === 'PRESENT').length}
Event Date: ${event.starts_at}

Return JSON:
{
  "summary": "...",
  "insights": [
    { "type": "warning|success|info|action", "message": "...", "count": null }
  ],
  "recommendations": [
    { "text": "...", "priority": "high|medium|low" }
  ],
  "engagementScore": 0,
  "predictedAttendanceRate": 0,
  "segments": {
    "vipPending": ["guest names"],
    "engaged": ["guest names"],
    "atRisk": ["guest names"]
  }
}`;

  const { content, usage, latencyMs } = await callAI({ feature: "guest_analysis", systemPrompt: system, userPrompt: user, responseFormat: "json", maxTokens: 2000 });
  logAIGeneration({ organizationId, userId, eventId, feature: "guest_analysis", usage, inputSnapshot: `${guests.length} guests`, outputSnapshot: JSON.stringify(content).slice(0, 500), latencyMs });
  return content;
}

// 5. Generate Smart Seating
export async function generateSmartSeatingService({ organizationId, userId, eventId, instructions }) {
  const [seatsRes, guestsRes] = await Promise.all([
    db.query("SELECT id, table_name AS name, capacity FROM seating_tables WHERE event_id = $1", [eventId]),
    db.query("SELECT id, full_name AS name, is_vip, group_name, dietary_requirements FROM guests WHERE event_id = $1 AND rsvp_status = 'GOING'", [eventId]),
  ]);

  const system = `You are an expert event seating planner. Return ONLY valid JSON.`;
  const user = `Generate optimal seating assignments.
Instructions: "${instructions}"
Tables: ${JSON.stringify(seatsRes.rows)}
Guests (confirmed): ${JSON.stringify(guestsRes.rows)}

Return JSON:
{
  "planSummary": "...",
  "assignments": [
    { "guestId": "...", "guestName": "...", "tableId": "...", "tableName": "...", "reason": "..." }
  ],
  "unassignedGuests": ["..."],
  "conflicts": ["..."],
  "optimizationScore": 0
}`;

  const { content, usage, latencyMs } = await callAI({ feature: "smart_seating", systemPrompt: system, userPrompt: user, responseFormat: "json", maxTokens: 3000 });
  logAIGeneration({ organizationId, userId, eventId, feature: "smart_seating", usage, inputSnapshot: instructions, outputSnapshot: JSON.stringify(content).slice(0, 500), latencyMs });
  return content;
}

// 6. Generate Post-Event Summary
export async function generatePostEventSummaryService({ organizationId, userId, eventId }) {
  const [eventRes, statsRes] = await Promise.all([
    db.query("SELECT title, event_type, starts_at, ends_at FROM events WHERE id = $1", [eventId]),
    db.query(`
      SELECT
        COUNT(DISTINCT g.id) AS total_guests,
        COUNT(DISTINCT CASE WHEN ga.attendance_status IN ('CHECKED_IN','PRESENT') THEN g.id END) AS attended,
        COUNT(DISTINCT it.id) AS tickets_sold,
        COALESCE(SUM(o.total) FILTER (WHERE o.payment_status = 'PAID'), 0) AS total_revenue
      FROM events e
      LEFT JOIN guests g ON g.event_id = e.id
      LEFT JOIN guest_attendance ga ON ga.guest_id = g.id AND ga.event_id = e.id
      LEFT JOIN issued_tickets it ON it.event_id = e.id
      LEFT JOIN ticket_orders o ON o.event_id = e.id
      WHERE e.id = $1
    `, [eventId]),
  ]);

  const event = eventRes.rows[0] ?? {};
  const stats = statsRes.rows[0] ?? {};

  const system = `You are an expert event performance analyst. Return ONLY valid JSON.`;
  const user = `Generate a comprehensive post-event summary for "${event.title}":
Type: ${event.event_type}
Date: ${event.starts_at}
Total Guests: ${stats.total_guests}
Attended: ${stats.attended}
Tickets Sold: ${stats.tickets_sold}
Revenue: ${stats.total_revenue}

Return JSON:
{
  "headline": "...",
  "executiveSummary": "...",
  "metrics": {
    "attendanceRate": "...",
    "sellThrough": "...",
    "revenue": "...",
    "peakCheckinTime": "..."
  },
  "highlights": ["..."],
  "improvements": ["..."],
  "nextEventRecommendations": ["..."],
  "socialCaption": "...",
  "performanceGrade": "A|B|C|D|F"
}`;

  const { content, usage, latencyMs } = await callAI({ feature: "post_event_summary", systemPrompt: system, userPrompt: user, responseFormat: "json", maxTokens: 2000 });
  logAIGeneration({ organizationId, userId, eventId, feature: "post_event_summary", usage, inputSnapshot: JSON.stringify(stats), outputSnapshot: JSON.stringify(content).slice(0, 500), latencyMs });
  return content;
}

// 7. Generate Email Copy
export async function generateEmailCopyService({ organizationId, userId, eventId, emailType, tone, customInstructions, recipientSegment }) {
  let eventContext = "";
  if (eventId) {
    const { rows } = await db.query("SELECT title, starts_at, venue_name, description FROM events WHERE id = $1", [eventId]);
    if (rows[0]) eventContext = JSON.stringify(rows[0]);
  }

  const system = `You are an expert email copywriter for events. Return ONLY valid JSON.`;
  const user = `Write ${emailType} email copy for an event.
Tone: ${tone || "professional"}
Recipient: ${recipientSegment || "all guests"}
Custom instructions: ${customInstructions || "none"}
Event context: ${eventContext}

Return JSON:
{
  "subjectLines": ["...", "...", "..."],
  "previewText": "...",
  "htmlBody": "...",
  "plainTextBody": "...",
  "ctaText": "...",
  "personalizationTokens": ["{{first_name}}", "{{event_date}}"]
}`;

  const { content, usage, latencyMs } = await callAI({ feature: "email_copy", systemPrompt: system, userPrompt: user, responseFormat: "json", maxTokens: 3000 });
  logAIGeneration({ organizationId, userId, eventId, feature: "email_copy", usage, inputSnapshot: emailType, outputSnapshot: JSON.stringify(content).slice(0, 500), latencyMs });
  return content;
}

// 8. Chatbot Reply
export async function chatbotReplyService({ eventId, sessionToken, message, visitorId }) {
  if (!eventId || !message) throw new AppError("eventId and message required", 400);

  // Fetch or create session
  let session;
  const { rows: existing } = await db.query(
    "SELECT * FROM ai_chatbot_sessions WHERE session_token = $1 AND event_id = $2",
    [sessionToken, eventId]
  );

  if (existing.length) {
    session = existing[0];
  } else {
    const { rows: created } = await db.query(
      "INSERT INTO ai_chatbot_sessions (event_id, session_token, visitor_id, messages) VALUES ($1, $2, $3, $4) RETURNING *",
      [eventId, sessionToken, visitorId ?? null, JSON.stringify([])]
    );
    session = created[0];
  }

  // Fetch event info
  const { rows: eventRows } = await db.query(
    "SELECT title, description, starts_at, ends_at, venue_name, event_type FROM events WHERE id = $1",
    [eventId]
  );
  const event = eventRows[0];
  if (!event) throw new AppError("Event not found", 404);

  const { rows: ticketTypes } = await db.query(
    "SELECT name, price, quantity_total, quantity_sold FROM ticket_types WHERE event_id = $1",
    [eventId]
  );

  const history = (session.messages || []).slice(-10);

  const system = `You are a friendly, helpful assistant for the event "${event.title}".
Event details: ${JSON.stringify({ ...event, ticketTypes })}
Only answer questions about this specific event. Never make up information.
Keep replies concise — maximum 3 sentences. Be warm and helpful.`;

  const conversationMessages = [
    ...history.map(m => ({ role: m.role, content: m.content })),
    { role: "user", content: message },
  ];

  // Direct Anthropic call for chatbot (multi-turn)
  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

  if (!ANTHROPIC_API_KEY) {
    throw new Error("Anthropic API key not configured. Please contact support.");
  }

  let resp;
  try {
    resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-opus-4-7",
        max_tokens: 512,
        system,
        messages: conversationMessages,
      }),
    });
  } catch (fetchError) {
    console.error("Anthropic API fetch failed:", fetchError);
    throw new Error("AI service temporarily unavailable. Please try again later.");
  }

  if (!resp.ok) {
    const errorText = await resp.text();
    console.error("Anthropic API error:", resp.status, errorText);
    throw new Error("AI service error. Please try again later.");
  }

  const json = await resp.json();
  const reply = json.content?.[0]?.text ?? "I'm sorry, I couldn't process your question right now.";

  // Update session messages
  const updatedMessages = [
    ...session.messages,
    { role: "user", content: message, timestamp: new Date().toISOString() },
    { role: "assistant", content: reply, timestamp: new Date().toISOString() },
  ];

  await db.query(
    "UPDATE ai_chatbot_sessions SET messages = $1, updated_at = NOW() WHERE id = $2",
    [JSON.stringify(updatedMessages), session.id]
  );

  return { reply, sessionToken };
}

// 9. Generate RSVP Form
export async function generateRsvpFormService({ organizationId, userId, eventId, customInstructions, eventType }) {
  let eventContext = {};
  if (eventId) {
    const { rows } = await db.query("SELECT title, event_type, guest_count_estimate FROM events WHERE id = $1", [eventId]);
    if (rows[0]) eventContext = rows[0];
  }

  const system = `You are an expert UX designer for event registration forms. Return ONLY valid JSON.`;
  const user = `Design the optimal RSVP form for this event:
Event Type: ${eventType || eventContext.event_type || "general"}
Title: ${eventContext.title || "Event"}
Custom instructions: ${customInstructions || "none"}

Tailor fields to the event type (weddings: meal choice + plus-one; conferences: job title + sessions; concerts: accessibility needs).

Return JSON:
{
  "fields": [
    {
      "fieldName": "...",
      "label": "...",
      "inputType": "text|email|select|checkbox|textarea|number",
      "required": true,
      "options": [],
      "placeholder": "...",
      "reason": "..."
    }
  ],
  "estimatedCompletionTime": "...",
  "formIntroText": "...",
  "thankYouMessage": "..."
}`;

  const { content, usage, latencyMs } = await callAI({ feature: "rsvp_form", systemPrompt: system, userPrompt: user, responseFormat: "json", maxTokens: 2000 });
  logAIGeneration({ organizationId, userId, eventId, feature: "rsvp_form", usage, inputSnapshot: JSON.stringify(eventContext), outputSnapshot: JSON.stringify(content).slice(0, 500), latencyMs });
  return content;
}

// 10. Performance Prediction
export async function generatePerformancePredictionService({ organizationId, userId, eventId }) {
  const [eventRes, salesRes] = await Promise.all([
    db.query("SELECT title, event_type, starts_at, capacity, is_published, created_at FROM events WHERE id = $1", [eventId]),
    db.query(`
      SELECT
        COUNT(DISTINCT it.id) AS tickets_sold,
        COALESCE(SUM(o.total) FILTER (WHERE o.payment_status = 'PAID'), 0) AS revenue,
        COUNT(DISTINCT CASE WHEN g.rsvp_status = 'GOING' THEN g.id END) AS rsvp_confirmed
      FROM events e
      LEFT JOIN issued_tickets it ON it.event_id = e.id
      LEFT JOIN ticket_orders o ON o.event_id = e.id
      LEFT JOIN guests g ON g.event_id = e.id
      WHERE e.id = $1
    `, [eventId]),
  ]);

  const event = eventRes.rows[0] ?? {};
  const sales = salesRes.rows[0] ?? {};

  const system = `You are an expert event performance analyst. Return ONLY valid JSON.`;
  const user = `Predict performance for "${event.title}":
Event Type: ${event.event_type}
Event Date: ${event.starts_at}
Capacity: ${event.capacity || "unlimited"}
Published: ${event.is_published}
Published At: ${event.created_at}
Tickets Sold: ${sales.tickets_sold}
Revenue So Far: ${sales.revenue}
RSVP Confirmed: ${sales.rsvp_confirmed}

Return JSON:
{
  "predictionStatement": "...",
  "sellThroughRange": { "low": "...", "mid": "...", "high": "..." },
  "daysToSellout": null,
  "revenueRange": { "low": 0, "mid": 0, "high": 0 },
  "confidenceScore": 0,
  "status": "on_track|ahead|behind|at_risk",
  "velocityAnalysis": "...",
  "immediateActions": [
    { "action": "...", "urgency": "high|medium|low" }
  ],
  "comparisonNote": "..."
}`;

  const { content, usage, latencyMs } = await callAI({ feature: "performance_prediction", systemPrompt: system, userPrompt: user, responseFormat: "json", maxTokens: 1500 });
  logAIGeneration({ organizationId, userId, eventId, feature: "performance_prediction", usage, inputSnapshot: JSON.stringify(sales), outputSnapshot: JSON.stringify(content).slice(0, 500), latencyMs });
  return content;
}
