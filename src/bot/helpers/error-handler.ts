import { BotError, NextFunction } from 'grammy';

import { Context } from '~/bot/types';

export const handleError = (error: BotError<Context>, next?: NextFunction) => {
  const { ctx } = error;
  ctx.logger.error({ err: error.error });
  return next?.();
};
