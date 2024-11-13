import { RedisAdapter } from '@grammyjs/storage-redis';
import { Redis } from 'ioredis';

import { config } from './config';

export const redisConnection = new Redis(config.REDIS_URL, {
  maxRetriesPerRequest: null,
});

// export const redisConnection = new Redis({
//   host: 'redis://redis:6379/0',
//   port: 6379,
//   connectTimeout: 10000,
// });

redisConnection.ping()
  .then(result => {
    console.log('Redis is connected:', result);
  })
  .catch(err => {
    console.error('Error connecting to Redis:', err);
  });


export const storage = new RedisAdapter({
  instance: redisConnection,
  ttl: 60 * 60, // 1 hour ttl
});
