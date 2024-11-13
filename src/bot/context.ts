import { type Api, Context as DefaultContext } from 'grammy';
import { Update, UserFromGetMe } from 'grammy/types';

import { Context, ExtendedContextFlavor } from '~/bot/types/context';
import { Container } from '~/container';
import { Logger } from '~/logger';
import { PrismaClientX } from '~/prisma';

export function createContextConstructor(container: Container) {
  return class extends DefaultContext implements ExtendedContextFlavor {
    prisma: PrismaClientX;
    logger: Logger;

    constructor(update: Update, api: Api, me: UserFromGetMe) {
      super(update, api, me);

      Object.defineProperties(this, {
        container: { writable: true },
        prisma: { writable: true },
        logger: { writable: true },
      });

      this.prisma = container.prisma;
      this.logger = container.logger.child({ update_id: update.update_id });
    }
  } as unknown as new (update: Update, api: Api, me: UserFromGetMe) => Context;
}
