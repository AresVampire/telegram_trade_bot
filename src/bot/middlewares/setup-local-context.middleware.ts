import { AsyncLocalStorage } from 'async_hooks';
import { Middleware } from 'grammy';

import { Context } from '~/bot/types';
import { LocalContext } from '~/bot/types/context';

export const middleware = (): Middleware<Context> => (ctx, next) => {
  const store = new AsyncLocalStorage<LocalContext>();

  return store.run({}, () => {
    ctx.local = store.getStore() as LocalContext;
    return next();
  });
};
