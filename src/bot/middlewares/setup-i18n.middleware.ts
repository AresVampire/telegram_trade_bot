import { I18n } from '@grammyjs/i18n';
import { Middleware } from 'grammy';

import { type Context } from '~/bot/types';

const i18n = new I18n<Context>({
  defaultLocale: 'en',
  directory: 'locales',
  fluentBundleOptions: { useIsolating: false },
  globalTranslationContext: (ctx) => ({
    chain: ctx.local.user!.chain,
    nativeCurrency: 'XXX',
    balance: 'XXX',
  }),
  // TODO: locale nego
});

export const middleware = (): Middleware<Context> => i18n;
