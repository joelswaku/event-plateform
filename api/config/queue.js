import { Queue } from "bullmq";
import { redis } from "./redis.js";

export const emailQueue = new Queue("email", {
  connection: redis,
});

export const notificationQueue = new Queue("notifications", {
  connection: redis,
});

export const reminderQueue = new Queue("reminders", {
  connection: redis,
});