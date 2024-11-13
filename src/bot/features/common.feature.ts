import { Composer } from 'grammy';

import { logHandle } from '~/bot/helpers/logging';
import { Context } from '~/bot/types';

import '../helpers/utils';
import { welcomeKeyboard } from '../keyboards';
import { createWallet } from './wallet.feature';

export const composer = new Composer<Context>();

const feature = composer.chatType('private');

feature.callbackQuery(
  'btn_back',
  logHandle('click-back-button'),
  async (ctx) => {
    await ctx.conversation.exit();
    await ctx.answerCallbackQuery();
    await ctx.deleteMessage();
  }
);

feature.callbackQuery(
  'btn_back_welcome',
  logHandle('click-back-button-welcome'),
  async (ctx) => {
    await ctx.answerCallbackQuery();
    if (!ctx.local.user?.publicAddress) {
      await createWallet(ctx);
    } else {
      return ctx.reply(
        ctx.t('text.welcome', { address: ctx.local.user.publicAddress }),
        { reply_markup: await welcomeKeyboard(ctx) }
      );
    }
  }
);
