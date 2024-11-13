import { Middleware } from 'grammy';

import { generateReferralCode } from '~/bot/helpers/utils';
import { Context, SessionData } from '~/bot/types';
import { createPrisma } from '~/prisma';

export const middleware = (): Middleware<Context> => async (ctx, next) => {
  if (ctx.from?.is_bot === false) {
    const { id: userId, language_code: languageCode } = ctx.from;
    const prismaClient = createPrisma();
    const referralCode = generateReferralCode();

    const user = await prismaClient.user.findFirst({ where: { userId } });

    ctx.local.user = await prismaClient.user.upsert({
      where: { userId },
      create: {
        languageCode,
        referralCode,
        userId,
        chain: user?.chain || 'INJECTIVE',
      },
      update: { languageCode },
    });

    if (ctx.local.user) {
      ctx.session.settings = {
        ...ctx.session.settings,
        ...(ctx.local.user.settings as SessionData['settings']),
      };
    }
  }

  return next();
};
