import Redis from "ioredis";

// Redis is optional - only connect if REDIS_URL is provided
let redis = null;

if (process.env.REDIS_URL && process.env.REDIS_URL !== 'redis://') {
  redis = new Redis(process.env.REDIS_URL);
  console.log('✅ Redis configured');
} else {
  console.log('⚠️  Redis not configured - caching disabled');
}

export { redis };
