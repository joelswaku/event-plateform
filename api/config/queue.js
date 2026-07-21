import { Queue } from "bullmq";
import { redis } from "./redis.js";

// Queues are optional - only create if Redis is available
export const emailQueue = redis ? new Queue("email", { connection: redis }) : null;

export const notificationQueue = redis ? new Queue("notifications", { connection: redis }) : null;

export const reminderQueue = redis ? new Queue("reminders", { connection: redis }) : null;

if (!redis) {
  console.log('⚠️  Queues disabled - Redis not configured');
}
