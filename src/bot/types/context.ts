import type { ConversationFlavor } from '@grammyjs/conversations';
import { Conversation as DefaultConversation } from '@grammyjs/conversations';
import type { HydrateFlavor } from '@grammyjs/hydrate';
import type { I18nFlavor } from '@grammyjs/i18n';
import type { ParseModeFlavor } from '@grammyjs/parse-mode';
import { User } from '@prisma/client';
import { Context as DefaultContext, type SessionFlavor } from 'grammy';

import { Logger } from '~/logger';
import { PrismaClientX } from '~/prisma';

import { SessionData } from './session';

export interface LocalContext {
  user?: User;
}

export interface LocalContextFlavor {
  local: LocalContext;
}

export interface ExtendedContextFlavor {
  prisma: PrismaClientX;
  logger: Logger;
}

export type Context = ParseModeFlavor<
  HydrateFlavor<
    DefaultContext &
      SessionFlavor<SessionData> &
      I18nFlavor &
      LocalContextFlavor &
      ExtendedContextFlavor &
      ConversationFlavor
  >
>;

export type Conversation = DefaultConversation<Context>;
