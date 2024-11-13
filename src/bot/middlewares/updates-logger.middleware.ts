import { Middleware } from 'grammy';

import { Context } from '~/bot/types';

export const middleware = (): Middleware<Context> => (ctx, next) => {
  ctx.logger.debug({
    msg: 'update received',
    ...ctx.update,
  });
  return next();
};
