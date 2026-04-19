import { z } from "zod";

/*
  CREATE EVENT SCHEMA
*/

const createEventSchema = z.object({

  title: z.string().min(3).max(200),

  description: z.string().max(5000).optional().nullable(),

  event_type: z.string().min(2),

  visibility: z.enum(["public", "private"]).optional(),

  venue_name: z.string().max(200).optional().nullable(),

  address_line_1: z.string().max(200).optional().nullable(),

  address_line_2: z.string().max(200).optional().nullable(),

  city: z.string().max(120).optional().nullable(),

  state: z.string().max(120).optional().nullable(),

  postal_code: z.string().max(40).optional().nullable(),

  country: z.string().max(120).optional().nullable(),

  timezone: z.string(),

  starts_at: z.string(),

  ends_at: z.string(),

  allow_rsvp: z.boolean().optional(),

  allow_guests_plus_one: z.boolean().optional(),

  allow_public_page: z.boolean().optional(),

  max_guests: z.number().int().positive().optional().nullable(),

  currency: z.string().length(3).optional()

});

/*
  UPDATE EVENT SCHEMA
*/

const updateEventSchema = createEventSchema.partial();

/*
  VALIDATION MIDDLEWARE
*/

export function validateCreateEvent(req, res, next) {

  try {

    req.body = createEventSchema.parse(req.body);

    next();

  } catch (err) {

    return res.status(400).json({
      success: false,
      message: "Invalid event data",
      errors: err.errors
    });

  }

}

export function validateUpdateEvent(req, res, next) {

  try {

    req.body = updateEventSchema.parse(req.body);

    next();

  } catch (err) {

    return res.status(400).json({
      success: false,
      message: "Invalid update data",
      errors: err.errors
    });

  }

}
