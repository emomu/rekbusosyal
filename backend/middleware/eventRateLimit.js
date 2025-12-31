/**
 * SECURITY: Event Creation Rate Limiting
 * Prevents spam and abuse of event creation
 * Club managers can create max 5 events per hour
 */

const eventCreationStore = new Map();

// Cleanup old entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of eventCreationStore.entries()) {
    if (now > record.resetTime) {
      eventCreationStore.delete(key);
    }
  }
}, 10 * 60 * 1000);

const eventRateLimit = (req, res, next) => {
  const userId = req.user?.userId;

  if (!userId) {
    return res.status(401).json({ error: 'Kimlik doğrulaması gerekli' });
  }

  const now = Date.now();
  const windowMs = 60 * 60 * 1000; // 1 hour
  const maxEvents = 5; // Max 5 events per hour

  const record = eventCreationStore.get(userId) || {
    count: 0,
    resetTime: now + windowMs
  };

  // Reset if window expired
  if (now > record.resetTime) {
    record.count = 0;
    record.resetTime = now + windowMs;
  }

  // Check if limit exceeded
  if (record.count >= maxEvents) {
    const retryAfter = Math.ceil((record.resetTime - now) / 1000 / 60); // minutes
    return res.status(429).json({
      error: `Çok fazla etkinlik oluşturdunuz. ${retryAfter} dakika sonra tekrar deneyin.`,
      retryAfter: retryAfter
    });
  }

  // Increment counter
  record.count++;
  eventCreationStore.set(userId, record);

  console.log(`✅ Event rate limit: ${userId} - ${record.count}/${maxEvents} events in window`);

  next();
};

module.exports = eventRateLimit;
