import { Chain } from '@prisma/client';
import { InlineKeyboard } from 'grammy';

import { Context, Position } from '~/bot/types';
import { EXPLORER_LINKS } from '~/constants/explorerLinks';

import { getUserChain } from '../helpers/getUserChain';
import { hashAddress } from '../helpers/hashAddress';
import { selectChain } from '../helpers/utils';

export const welcomeKeyboard = async (ctx: Context) => {
  return new InlineKeyboard()
    .text(ctx.t('label.buy'), 'btn_buy_token')
    .text(ctx.t('label.sell_manage'), 'btn_manage_positions')
    .row()
    .text(ctx.t('label.wallet'), 'btn_wallet')
    .text(ctx.t('label.settings'), 'btn_settings')
    .text(ctx.t('label.help'), 'btn_help')
    .row()
    .text(ctx.t('label.refer_friend'), 'btn_refer')
    .text(ctx.t('label.refresh'), 'btn_refresh')
    .row()
    .text(ctx.t('label.switch_chain'), 'switch_chain')
    .text(
      ctx.local.user!.chain === 'ETHEREUM'
        ? ctx.t('label.ethereum_chain')
        : ctx.local.user!.chain === 'BINANCE'
          ? ctx.t('label.binance_chain')
          : ctx.t('label.injective_chain')
    );
};

export const walletKeyboard = async (ctx: Context, nativeCurrency: string) => {
  const userChain = await getUserChain(Number(ctx.local.user?.userId));
  return new InlineKeyboard()
    .url(
      ctx.local.user!.chain === 'INJECTIVE'
        ? ctx.t('label.injective_explorer')
        : ctx.t('label.etherscan'),
      `${EXPLORER_LINKS[userChain]}${(
        ctx.local.user?.publicAddress as string
      ).toLowerCase()}`
    )
    .row()
    .text(ctx.t('label.withdraw_x', { nativeCurrency }), 'btn_withdraw:x')
    .text(ctx.t('label.withdraw_all', { nativeCurrency }), 'btn_withdraw:all')
    .text(ctx.t('label.deposit'), 'btn_deposit')
    .row()
    .text(ctx.t('label.export_key'), 'btn_export_key')
    .text(ctx.t('label.refresh'), 'btn_refresh_wallet')
    .text(ctx.t('label.delete_wallet'), 'btn_delete_wallet')
    .row()
    .text(ctx.t('label.close'), 'btn_back');
};

export const backKeyboard = async (ctx: Context) => {
  return new InlineKeyboard().text(ctx.t('label.close'), 'btn_back');
};

export const transConfirmKeyboard = async (ctx: Context) => {
  return new InlineKeyboard()
    .text(ctx.t('label.cancel'), 'btn_trans_cancel')
    .text(ctx.t('label.confirm'), 'btn_trans_confirm');
};

export const deleteConfirmKeyboard = async (ctx: Context) => {
  return new InlineKeyboard()
    .text(ctx.t('label.cancel'), 'btn_back')
    .text(ctx.t('label.confirm'), 'btn_delete_confirm');
};

export const createWalletKeyboard = async (ctx: Context) => {
  return new InlineKeyboard()
    .text(ctx.t('label.import_key'), 'btn_import_key')
    .text(ctx.t('label.generate_wallet'), 'btn_generate_wallet');
};

export const exportKeyKeyboard = async (ctx: Context) => {
  return new InlineKeyboard()
    .text(ctx.t('label.no'), 'btn_back')
    .text(ctx.t('label.yes'), 'btn_confirm_otp');
};

export const settingsKeyboard = async (ctx: Context) => {
  const selectedChain = await selectChain(Number(ctx.local.user?.userId));
  const nativeCurrency = selectedChain.nativeCurrency();

  return new InlineKeyboard()
    .text(ctx.t('label.general_settings'))
    .row()
    .text(
      (Number(ctx.session.settings.announce_status) === 1 ? '🟢 ' : '🔴 ') +
        ctx.t('label.announcements'),
      'btn_announcements'
    )
    .text(
      `✎${ctx.t('label.min_pos', {
        value: String(ctx.session.settings.pos_value),
        nativeCurrency: String(nativeCurrency),
      })}`,
      'btn_pos_value'
    )
    .row()
    .text(ctx.t('label.buy_btns_config'))
    .row()
    .text(
      `✎ Left ${ctx.session.settings.buy_left} ${nativeCurrency}`,
      'btn_buy_left_set'
    )
    .text(
      `✎ Right ${ctx.session.settings.buy_right} ${nativeCurrency}`,
      'btn_buy_right_set'
    )
    .row()
    .text(ctx.t('label.sell_btns_config'))
    .row()
    .text(`✎ Left ${ctx.session.settings.sell_left} %`, 'btn_sell_left_set')
    .text(`✎ Right ${ctx.session.settings.sell_right} %`, 'btn_sell_right_set')
    .row()
    .text(ctx.t('label.slippage_config'))
    .row()
    .text(`✎ Buy ${ctx.session.settings.slippage_buy} %`, 'btn_slippage_buy')
    .text(`✎ Sell ${ctx.session.settings.slippage_sell} %`, 'btn_slippage_sell')
    .row()
    .text(ctx.t('label.auto_buy'))
    .row()
    .text(
      Number(ctx.session.settings.auto_status) === 1
        ? `🟢 ${ctx.t('label.enabled')}`
        : `🔴 ${ctx.t('label.disabled')}`,
      'btn_auto_status'
    )
    .text(
      `✎ ${ctx.session.settings.auto_value} ${nativeCurrency}`,
      'btn_auto_set'
    )
    .row()
    .text(ctx.t('label.trans_priority'), 'btn_priority')
    .row()
    .text(
      `⇌ ${
        Number(ctx.session.settings.trans_level) === 0
          ? ctx.t('label.low')
          : Number(ctx.session.settings.trans_level) === 1
            ? ctx.t('label.medium')
            : ctx.t('label.high')
      }`,
      'btn_priority_level'
    )
    .row()
    .text(ctx.t('label.close'), 'btn_back');
};

// FIXME: Follow presets
export const sellManageKeyboard = async (ctx: Context, info: any) => {
  const selectedChain = await selectChain(Number(ctx.local.user?.userId));
  const positions = await selectedChain.getPositionTokenAddresses(
    String(ctx.local.user?.publicAddress).toLowerCase(),
    ctx.session.settings.pos_value
  );

  const currentIndex = positions.findIndex((el) => el.address === info.address);
  const nextIndex = (currentIndex + 1) % positions.length;
  const prevIndex = (currentIndex + positions.length - 1) % positions.length;

  const prevAddressHash = await hashAddress(positions[prevIndex].address);
  const nextAddressHash = await hashAddress(positions[nextIndex].address);
  const hashedAddress = await hashAddress(info.address);

  return new InlineKeyboard()
    .text(ctx.t('label.buy_more'), 'btn_buy_more_position')
    .row()
    .text(
      ctx.t('label.sell_btn', {
        value: String(ctx.session.settings.sell_left),
      }),
      `btn_sell_pg:${String(ctx.session.settings.sell_left)}:${hashedAddress}`
    )
    .text(
      ctx.t('label.sell_btn', {
        value: String(ctx.session.settings.sell_right),
      }),
      `btn_sell_pg:${String(ctx.session.settings.sell_right)}:${hashedAddress}`
    )
    .row()
    .text('◀️ Prev', `single_position:${prevAddressHash}`)
    .text(info.tokenName)
    .text('Next ▶️', `single_position:${nextAddressHash}`)
    .row()
    .text(
      ctx.t('label.sell_x_btn_amount', { value: 'X' }),
      `btn_sell_x:X:${hashedAddress}`
    )
    .text(
      ctx.t('label.sell_x_btn_percentage', { value: 'X' }),
      `btn_sell_x:Y:${hashedAddress}`
    )
    .row()
    .text(ctx.t('label.refresh'), `btn_refresh_position:${hashedAddress}`)
    .url(
      ctx.local.user!.chain === 'INJECTIVE'
        ? ctx.t('label.injective_explorer')
        : ctx.local.user!.chain === 'ETHEREUM'
          ? ctx.t('label.etherscan')
          : ctx.t('label.bscscan'),
      `${selectedChain.explorerURL()}address/${info.address}`
    )
    .text(ctx.t('label.close'), 'btn_back')
    .row();
};

export const positionsListKeyboard = async (
  ctx: Context,
  positions: Position[]
) => {
  const keyboard = new InlineKeyboard();

  positions.forEach((position) => {
    return keyboard
      .text(
        ctx.t('text.position_list', { ...position }),
        `btn_select_position:${position.address}`
      )
      .row();
  });

  return keyboard.text(ctx.t('label.close'), 'btn_back');
};

export const depositWalletKeyboard = async (ctx: Context) => {
  return new InlineKeyboard().text(
    ctx.t('label.deposit'),
    'btn_deposit_native'
  );
};

export const selectChainKeyboard = async (ctx: Context) => {
  return new InlineKeyboard()
    .text(ctx.t('label.ethereum_chain'), `btn_select_chain:${Chain.ETHEREUM}`)
    .text(ctx.t('label.binance_chain'), `btn_select_chain:${Chain.BINANCE}`)
    .text(ctx.t('label.injective_chain'), `btn_select_chain:${Chain.INJECTIVE}`)
    .row()
    .text(ctx.t('label.close'), 'btn_back');
};
