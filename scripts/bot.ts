import { onShutdown } from 'node-graceful-shutdown';

import { createBot } from '~/bot';
import { config } from '~/config';
import { createContainer } from '~/container';
import { storage } from '~/redis';
import { createServer } from '~/server';

const container = createContainer();

const run = async () => {
  const bot = createBot(config.BOT_TOKEN, {
    container,
    sessionStorage: storage,
  });
  await bot.init();

  const server = createServer(bot, container);

  onShutdown(async () => {
    container.logger.info('shutting down...');
    await server.close();
    await bot.stop();
  });

  if (config.BOT_MODE === 'webhook' && config.BOT_WEBHOOK.length) {
    await server.listen({
      host: config.BIND,
      port: config.PORT,
    });

    await bot.api.setWebhook(config.BOT_WEBHOOK, {
      allowed_updates: [...config.BOT_ALLOWED_UPDATES],
    });
  } else {
    await bot.start({
      allowed_updates: [...config.BOT_ALLOWED_UPDATES],
      onStart: ({ username }) => {
        container.logger.info({
          msg: `bot started`,
          username,
        });
      },
    });
  }
};

run().catch((err) => {
  container.logger.error(err);
  process.exit(1);
});
