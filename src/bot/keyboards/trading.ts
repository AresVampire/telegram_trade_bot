import { InlineKeyboard } from 'grammy';

import { Context } from '~/bot/types';

import { selectChain } from '../helpers/utils';

export const buyTokenKeyboard = async (ctx: Context) => {
  const selectedChain = await selectChain(Number(ctx.local.user?.userId));
  const currency = selectedChain.nativeCurrency();
  const url = selectedChain.explorerURL();

  if (Number(ctx.session.settings.auto_status) === 1) {
    return new InlineKeyboard()
      .url(
        ctx.t('label.etherscan'),
        `${url}address/${ctx.session.token_address as string}`
      )
      .text(ctx.t('label.cancel'), 'btn_back');
  }

  return new InlineKeyboard()
    .url(
      ctx.t('label.etherscan'),
      `${url}address/${ctx.session.token_address as string}`
    )
    .text(ctx.t('label.cancel'), 'btn_back')
    .row()
    .text(
      ctx.t('label.buy_amount_token', {
        tokenAmount: `${ctx.session.settings.buy_left} ${currency}`,
      }),
      `buy_amount_token:${ctx.session.settings.buy_left}`
    )
    .text(
      ctx.t('label.buy_amount_token', {
        tokenAmount: `${ctx.session.settings.buy_right} ${currency}`,
      }),
      `buy_amount_token:${ctx.session.settings.buy_right}`
    )
    .text(
      ctx.t('label.buy_amount_token', { tokenAmount: `X ${currency}` }),
      'buy_amount_token:X'
    );
};

export const buyTokenAfterErrorKeyboard = async (ctx: Context) => {
  const selectedChain = await selectChain(Number(ctx.local.user?.userId));
  const currency = selectedChain.nativeCurrency();

  return new InlineKeyboard()
    .text(
      ctx.t('label.buy_amount_token', {
        tokenAmount: `${ctx.session.settings.buy_left} ${currency}`,
      }),
      `buy_amount_token:${ctx.session.settings.buy_left}`
    )
    .text(
      ctx.t('label.buy_amount_token', {
        tokenAmount: `${ctx.session.settings.buy_right} ${currency}`,
      }),
      `buy_amount_token:${ctx.session.settings.buy_right}`
    )
    .text(
      ctx.t('label.buy_amount_token', { tokenAmount: `X ${currency}` }),
      'buy_amount_token:X'
    )
    .row()
    .text(ctx.t('label.cancel'), 'btn_back')
    .row();
};

export const buyTokenConfirmKeyboard = async (ctx: Context) => {
  return new InlineKeyboard()
    .text(ctx.t('label.cancel'), 'btn_buy_cancel')
    .text(ctx.t('label.confirm'), 'btn_buy_confirm');
};

export const sellTokenKeyboard = async (ctx: Context) => {
  return new InlineKeyboard()
    .url(
      ctx.t('label.etherscan'),
      `https://sepolia.etherscan.io/address/${
        ctx.session.token_address as string
      }`
    )
    .text(ctx.t('label.cancel'), 'btn_back')
    .row()
    .text(
      ctx.t('label.sell_select_token', {
        tokenName: ctx.session.token_name as string,
      }),
      'sell_select_token'
    );
};

export const sellTokenConfirmKeyboard = async (ctx: Context) => {
  return new InlineKeyboard()
    .text(ctx.t('label.cancel'), 'btn_sell_cancel')
    .text(ctx.t('label.confirm'), 'btn_sell_confirm');
};
