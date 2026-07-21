import { Worker } from "bullmq";
import { redis } from "../config/redis.js";
import { sendEmail } from "../utils/sendEmail.js";

// Email worker is optional - only start if Redis is available
if (redis) {
  const worker = new Worker(
    "email",
    async (job) => {
      if (job.name === "welcome-email") {
        await sendEmail({
          to: job.data.email,
          subject: "Welcome 🎉",
          html: `<h2>Hello ${job.data.name}</h2>`
        });
      }
    },
    { connection: redis }
  );

  worker.on("completed", (job) => {
    console.log("Email job completed:", job.id);
  });

  worker.on("failed", (job, err) => {
    console.error("Email job failed:", err);
  });

  console.log('✅ Email worker started');
} else {
  console.log('⚠️  Email worker disabled - Redis not configured');
}
