import fastify from 'fastify';
import { BotError, webhookCallback } from 'grammy';

import { Bot } from '~/bot';
import { handleError } from '~/bot/helpers/error-handler';
import { config } from '~/config';
import { Container } from '~/container';

export const createServer = (bot: Bot, container: Container) => {
  const server = fastify({ logger: container.logger });

  server.setErrorHandler(async (error, _, response) => {
    if (error instanceof BotError) {
      await handleError(error);

      await response.status(200).send({});
    } else {
      container.logger.error(error);

      await response.status(500).send({ error: 'Something went wrong' });
    }
  });

  server.get('/healthz', async (_, response) => {
    await response.status(200).send('❤️');
  });

  server.post(`/${config.BOT_TOKEN}`, webhookCallback(bot, 'fastify'));

  server.addHook('onClose', (_, done) => {
    done();
  });

  return server;
};
