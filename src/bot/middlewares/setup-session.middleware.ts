import { Middleware, session } from 'grammy';

import { Context } from '~/bot/types';
import { storage } from '~/redis';

import { sessionKey } from '../helpers/utils';

export const middleware = (): Middleware<Context> =>
  session({
    initial: () => ({
      chain: 'ETHEREUM',
      balance: 0,
      settings: {
        announce_status: 1,
        pos_value: 0.001,
        auto_status: 0,
        auto_value: '0.1',
        trans_level: 0,
        trans_value: 0.0001,
        buy_left: 0.1,
        buy_right: 0.5,
        sell_left: 25,
        sell_right: 100,
        slippage_buy: 20,
        slippage_sell: 20,
      },
    }),
    getSessionKey: (ctx) => sessionKey(ctx.from!.id),
    storage: storage,
  });
