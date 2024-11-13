import { Composer } from 'grammy';

import { logHandle } from '~/bot/helpers/logging';
import { settingsKeyboard } from '~/bot/keyboards';
import { Context } from '~/bot/types';

import { selectChain } from '../helpers/utils';

export const composer = new Composer<Context>();

const feature = composer.chatType('private');

// Click announcements option in settings menu
feature.callbackQuery(
  'btn_announcements',
  logHandle('click-announcements'),
  async (ctx) => {
    ctx.session.settings.announce_status =
      Number(ctx.session.settings.announce_status) === 0 ? 1 : 0;
    await ctx.editMessageText(ctx.t('text.settings_desc'), {
      reply_markup: await settingsKeyboard(ctx),
    });
  }
);

// Click auto buy option in settings menu
feature.callbackQuery(
  'btn_auto_status',
  logHandle('click-buy-auto'),
  async (ctx) => {
    await ctx.answerCallbackQuery();
    ctx.session.settings.auto_status =
      Number(ctx.session.settings.auto_status) === 0 ? 1 : 0;
    await ctx.editMessageText(ctx.t('text.settings_desc'), {
      reply_markup: await settingsKeyboard(ctx),
    });
  }
);

// Click transaction priority level in settings menu
feature.callbackQuery(
  'btn_priority_level',
  logHandle('click-priority'),
  async (ctx) => {
    ctx.session.settings.trans_level =
      ctx.session.settings.trans_level + 1 > 2
        ? 0
        : ctx.session.settings.trans_level + 1;
    await ctx.editMessageText(ctx.t('text.settings_desc'), {
      reply_markup: await settingsKeyboard(ctx),
    });
  }
);

// Click position value in settings menu
feature.callbackQuery(
  'btn_pos_value',
  logHandle('click-pos-value'),
  async (ctx) => {
    await ctx.answerCallbackQuery();
    const selectedChain = await selectChain(Number(ctx.local.user?.userId));

    await ctx.reply(
      ctx.t('text.reply_pos_value', {
        nativeCurrency: selectedChain.nativeCurrency(),
      })
    );
    await ctx.conversation.exit();
    await ctx.conversation.enter('setPosValue');
  }
);

// Click buy buttons config left value in settings menu
feature.callbackQuery(
  'btn_buy_left_set',
  logHandle('click-buy-left-set-value'),
  async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.reply(ctx.t('text.reply_btn_buy_left_value'));
    await ctx.conversation.exit();
    await ctx.conversation.enter('setBuyLeftValue');
  }
);

// Click set buy slippage config value in settings menu
feature.callbackQuery(
  'btn_slippage_buy',
  logHandle('click-btn-slippage-buy'),
  async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.reply(ctx.t('text.reply_btn_slippage_buy'));
    await ctx.conversation.exit();
    await ctx.conversation.enter('setBuySlippageValue');
  }
);

// Click set sell slippage config value in settings menu
feature.callbackQuery(
  'btn_slippage_sell',
  logHandle('click-btn-slippage-sell'),
  async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.reply(ctx.t('text.reply_btn_slippage_sell'));
    await ctx.conversation.exit();
    await ctx.conversation.enter('setSellSlippageValue');
  }
);

// Click buy buttons config left value in settings menu
feature.callbackQuery(
  'btn_buy_right_set',
  logHandle('click-buy-right-set-value'),
  async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.reply(ctx.t('text.reply_btn_buy_right_value'));
    await ctx.conversation.exit();
    await ctx.conversation.enter('setBuyRightValue');
  }
);

// Click sell buttons config left value in settings menu
feature.callbackQuery(
  'btn_sell_left_set',
  logHandle('click-sell-left-set-value'),
  async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.reply(ctx.t('text.reply_btn_sell_left_value'));
    await ctx.conversation.exit();
    await ctx.conversation.enter('setSellLeftValue');
  }
);

// Click sell buttons config right value in settings menu
feature.callbackQuery(
  'btn_sell_right_set',
  logHandle('click-sell-right-set-value'),
  async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.reply(ctx.t('text.reply_btn_sell_right_value'));
    await ctx.conversation.exit();
    await ctx.conversation.enter('setSellRightValue');
  }
);

// Click auto buy amount in settings menu
feature.callbackQuery(
  'btn_auto_set',
  logHandle('click-auto-amount'),
  async (ctx) => {
    await ctx.answerCallbackQuery();

    await ctx.reply(ctx.t('text.reply_auto_amount', {}));
    await ctx.conversation.exit();
    await ctx.conversation.enter('setBuyTokenAmount');
  }
);

// Click auto priority amount in settings menu
feature.callbackQuery(
  'btn_priority_set',
  logHandle('click-priority-amount'),
  async (ctx) => {
    await ctx.answerCallbackQuery();

    await ctx.reply(ctx.t('text.reply_priority_amount', {}));
    await ctx.conversation.exit();
    await ctx.conversation.enter('setPriorityAmount');
  }
);
