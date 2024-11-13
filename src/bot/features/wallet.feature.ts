import { Chain } from '@prisma/client';
import { QueueEvents } from 'bullmq';
import { Composer, InlineKeyboard } from 'grammy';

import { logHandle } from '~/bot/helpers/logging';
import {
  decrypt,
  encrypt,
  selectChain,
  selectChainFromCtx,
} from '~/bot/helpers/utils';
import {
  backKeyboard,
  createWalletKeyboard,
  deleteConfirmKeyboard,
  exportKeyKeyboard,
  selectChainKeyboard,
  sellManageKeyboard,
  settingsKeyboard,
  walletKeyboard,
  welcomeKeyboard,
} from '~/bot/keyboards';
import { Context, Position } from '~/bot/types';
import { redisConnection } from '~/redis';
import {
  createPositionsQueue,
  createUserDetailsQueue,
  createWithdrawQueue,
  IUserDetailsWorkerReturnObject,
  IWithdrawReturnObject,
  POSITIONS_QUEUE_NAME,
  USER_DETAILS_QUEUE_NAME,
  WITHDRAW_QUEUE_NAME,
} from '~/workers';

import { getUserChain } from '../helpers/getUserChain';

export const composer = new Composer<Context>();

const feature = composer.chatType('private');

export const createWallet = async (ctx: Context) => {
  return ctx.reply(ctx.t('text.create_wallet'), {
    reply_markup: await createWalletKeyboard(ctx),
  });
};

export const wallet = async (ctx: Context) => {
  const userChain = await getUserChain(Number(ctx.local.user?.userId));
  const userDetailsQueue = createUserDetailsQueue({
    connection: redisConnection,
  });
  await userDetailsQueue.add(USER_DETAILS_QUEUE_NAME, {
    chain: userChain,
    userId: Number(ctx.local.user?.userId || ctx?.from?.id),
  });

  const queueEvents = new QueueEvents(USER_DETAILS_QUEUE_NAME, {
    connection: redisConnection,
  });

  try {
    queueEvents.once('completed', async ({ returnvalue }) => {
      const _returnValue =
        returnvalue as unknown as IUserDetailsWorkerReturnObject;

      const { balance, nativeCurrency, success } = _returnValue;

      if (!success) {
        throw new Error();
      }

      return ctx.reply(
        ctx.t('text.wallet_detail', {
          address: String(ctx.local.user?.publicAddress).toLowerCase(),
          balance,
          nativeCurrency,
        }),
        { reply_markup: await walletKeyboard(ctx, nativeCurrency) }
      );
    });
  } catch (error) {
    ctx.logger.error(error);
  }
};

export const sell = async (ctx: Context) => {
  await ctx.replyWithChatAction('typing');
  const userChain = await getUserChain(Number(ctx.local.user?.userId));

  const positionsQueue = createPositionsQueue({ connection: redisConnection });
  await positionsQueue.add(POSITIONS_QUEUE_NAME, {
    userPublicAddress: String(ctx.local.user?.publicAddress),
    posValue: ctx.session.settings.pos_value,
    chain: userChain,
  });

  const queueEvents = new QueueEvents(POSITIONS_QUEUE_NAME, {
    connection: redisConnection,
  });

  queueEvents.once(
    'completed',
    async ({
      returnvalue,
    }: {
      jobId: string;
      returnvalue: { address: string } | string;
    }) => {
      const _returnvalue = returnvalue as { address: string };
      if (!_returnvalue) {
        return ctx.reply(ctx.t('text.position_manage_none'), {
          parse_mode: 'HTML',
          reply_markup: new InlineKeyboard().text(
            ctx.t('label.close'),
            'btn_back'
          ),
        });
      }

      ctx.session.token_address = _returnvalue.address;

      return ctx.reply(ctx.t('text.position_detail', _returnvalue), {
        reply_markup: await sellManageKeyboard(ctx, _returnvalue),
      });
    }
  );
};

// Get reference link
feature.callbackQuery(
  'btn_refer',
  logHandle('click-refer-friends'),
  async (ctx) => {
    await ctx.answerCallbackQuery();
    const user = await ctx.prisma.user.findUnique({
      where: { userId: ctx.from.id },
      select: { referralCode: true },
    });

    if (user) {
      const botName = ctx.me.username;
      const { referralCode } = user;
      const base64String = Buffer.from(referralCode as string).toString(
        'base64'
      );

      const referLink = `https://t.me/${botName}?start=${base64String}`;
      await ctx.reply(ctx.t('text.referral_code', { referLink }), {
        reply_markup: new InlineKeyboard().text(
          ctx.t('label.close'),
          'btn_back'
        ),
      });
    }
  }
);

// Select chain
feature.callbackQuery(
  /^btn_select_chain\:/,
  logHandle('click-select-chain'),
  async (ctx) => {
    await ctx.answerCallbackQuery();

    const { data } = ctx.callbackQuery;

    const chain = data.split(':')[1] as Chain;

    ctx.session.chain = chain;
    ctx.local.user!.chain = chain;

    if (!ctx.local.user?.publicAddress) {
      return createWallet(ctx);
    }

    const userDetailsQueue = createUserDetailsQueue({
      connection: redisConnection,
    });
    await userDetailsQueue.add(
      USER_DETAILS_QUEUE_NAME,
      {
        chain,
        userId: Number(ctx.local.user?.userId),
      },
      { removeOnComplete: true }
    );

    const queueEvents = new QueueEvents(USER_DETAILS_QUEUE_NAME, {
      connection: redisConnection,
    });

    queueEvents.once('completed', async ({ returnvalue }) => {
      const _returnValue =
        returnvalue as unknown as IUserDetailsWorkerReturnObject;

      const { balance, nativeCurrency, success, publicAddress } = _returnValue;

      ctx.local.user = await ctx.prisma.user.update({
        where: { userId: ctx.from.id },
        data: { publicAddress: publicAddress, chain },
      });

      if (!success) {
        throw new Error();
      }

      if (Number(balance)) {
        return ctx.reply(
          ctx.t('text.welcome', {
            address: String(ctx?.local?.user?.publicAddress),
            balance,
            nativeCurrency,
          }),
          { reply_markup: await welcomeKeyboard(ctx) }
        );
      }

      return ctx.reply(
        ctx.t('text.welcome_wallet_empty', {
          address: String(ctx?.local?.user?.publicAddress),
          nativeCurrency,
        }),
        { reply_markup: await welcomeKeyboard(ctx) }
      );
    });
  }
);

// Go to wallet menu
feature.callbackQuery(
  'btn_wallet',
  logHandle('click-wallet-button'),
  async (ctx) => {
    await ctx.answerCallbackQuery();
    await wallet(ctx);
  }
);

// Refresh wallet
feature.callbackQuery(
  'btn_refresh_wallet',
  logHandle('click-refresh-wallet-button'),
  async (ctx) => {
    try {
      await ctx.answerCallbackQuery();

      await ctx.replyWithChatAction('typing');

      const userChain = await getUserChain(Number(ctx.local.user?.userId));

      const userDetailsQueue = createUserDetailsQueue({
        connection: redisConnection,
      });
      await userDetailsQueue.add(USER_DETAILS_QUEUE_NAME, {
        chain: userChain,
        userId: Number(ctx.local.user?.userId || ctx?.from?.id),
      });

      const queueEvents = new QueueEvents(USER_DETAILS_QUEUE_NAME, {
        connection: redisConnection,
      });
      queueEvents.once('completed', async ({ returnvalue }) => {
        const _returnValue =
          returnvalue as unknown as IUserDetailsWorkerReturnObject;

        const { balance, nativeCurrency, success } = _returnValue;

        if (!success) {
          throw new Error();
        }

        return ctx.editMessageText(
          ctx.t('text.wallet_detail', {
            address: (ctx.local.user?.publicAddress as string).toLowerCase(),
            balance,
            nativeCurrency,
          }),
          { reply_markup: await walletKeyboard(ctx, nativeCurrency) }
        );
      });
    } catch (error) {
      await ctx.answerCallbackQuery();
    }
  }
);

// Refresh start
feature.callbackQuery(
  'btn_refresh',
  logHandle('click-refresh-button'),
  async (ctx) => {
    try {
      await ctx.answerCallbackQuery();

      await ctx.answerCallbackQuery(ctx.t('answer.refreshed'));

      const userChain = await getUserChain(Number(ctx.local.user?.userId));

      const userDetailsQueue = createUserDetailsQueue({
        connection: redisConnection,
      });
      const userDetailsJob = await userDetailsQueue.add(
        USER_DETAILS_QUEUE_NAME,
        {
          chain: userChain,
          userId: Number(ctx.local.user?.userId || ctx?.from?.id),
        },
        { removeOnComplete: true }
      );

      const queueEventsUserDetails = new QueueEvents(USER_DETAILS_QUEUE_NAME, {
        connection: redisConnection,
      });
      const userDataResult = await userDetailsJob.waitUntilFinished(
        queueEventsUserDetails
      );

      if (Number(userDataResult.balance)) {
        return ctx.editMessageText(
          ctx.t('text.welcome', {
            address: String(ctx.local?.user?.publicAddress),
            balance: userDataResult.balance,
            nativeCurrency: userDataResult.nativeCurrency,
          }),
          { reply_markup: await welcomeKeyboard(ctx) }
        );
      }
      return ctx.editMessageText(
        ctx.t('text.welcome_wallet_empty', {
          address: String(ctx.local?.user?.publicAddress),
          nativeCurrency: userDataResult.nativeCurrency,
        }),
        { reply_markup: await welcomeKeyboard(ctx) }
      );
    } catch (error) {
      await ctx.answerCallbackQuery();
    }
  }
);

// Deposit token
feature.callbackQuery(
  'btn_deposit',
  logHandle('click-deposit-button'),
  async (ctx) => {
    await ctx.answerCallbackQuery();
    const selectedChain = await selectChain(Number(ctx.local.user?.userId));
    await ctx.reply(
      ctx.t('text.deposit_details', {
        address: (ctx.local.user?.publicAddress as string).toLowerCase(),
        nativeCurrency: selectedChain.nativeCurrency(),
      }),
      {
        reply_markup: new InlineKeyboard().text(
          ctx.t('label.close'),
          'btn_back'
        ),
      }
    );
  }
);

// Withdraw token
feature.callbackQuery(
  /^btn_withdraw\:/,
  logHandle('click-withdraw-button'),
  async (ctx) => {
    await ctx.answerCallbackQuery();
    const { data } = ctx.callbackQuery;

    const value = data.split(':')[1];

    if (value === 'x') {
      await ctx.conversation.exit();
      return ctx.conversation.enter('walletWithdrawAmount');
    }

    await ctx.conversation.exit();
    return ctx.conversation.enter('walletWithdrawAllAmount');
  }
);

// Withdraw transaction cancel
feature.callbackQuery(
  'btn_trans_cancel',
  logHandle('click-transaction-cancel'),
  async (ctx) => {
    try {
      await ctx.answerCallbackQuery();

      await ctx.replyWithChatAction('typing');

      const userChain = await getUserChain(Number(ctx.local.user?.userId));

      const userDetailsQueue = createUserDetailsQueue({
        connection: redisConnection,
      });
      await userDetailsQueue.add(USER_DETAILS_QUEUE_NAME, {
        chain: userChain,
        userId: Number(ctx.local.user?.userId || ctx?.from?.id),
      });

      const queueEvents = new QueueEvents(USER_DETAILS_QUEUE_NAME, {
        connection: redisConnection,
      });
      queueEvents.once('completed', async ({ returnvalue }) => {
        const _returnValue =
          returnvalue as unknown as IUserDetailsWorkerReturnObject;

        const { balance, nativeCurrency, success } = _returnValue;

        if (!success) {
          throw new Error();
        }

        return ctx.reply(
          ctx.t('text.wallet_detail', {
            address: (ctx.local.user?.publicAddress as string).toLowerCase(),
            nativeCurrency,
            balance,
          }),
          { reply_markup: await walletKeyboard(ctx, nativeCurrency) }
        );
      });
    } catch (error) {
      ctx.logger.error(error);
      await ctx.answerCallbackQuery();
    }
  }
);

// Withdraw transaction confirm
feature.callbackQuery(
  'btn_trans_confirm',
  logHandle('click-transaction-confirm'),
  async (ctx) => {
    try {
      await ctx.answerCallbackQuery();
      await ctx.editMessageReplyMarkup({
        reply_markup: new InlineKeyboard().text(
          ctx.t('label.cancel'),
          'btn_back'
        ),
      });

      const userChain = await getUserChain(Number(ctx.local.user?.userId));

      const userDetailsQueue = createUserDetailsQueue({
        connection: redisConnection,
      });

      const userDetailsJob = await userDetailsQueue.add(
        USER_DETAILS_QUEUE_NAME,
        {
          chain: userChain,
          userId: Number(ctx.local.user?.userId || ctx?.from?.id),
        },
        { removeOnComplete: true }
      );

      const queueEventsUserDetails = new QueueEvents(USER_DETAILS_QUEUE_NAME, {
        connection: redisConnection,
      });
      const userDataResult = await userDetailsJob.waitUntilFinished(
        queueEventsUserDetails
      );

      const { message_id } = await ctx.reply(ctx.t('text.sending'));

      const withdrawQueue = createWithdrawQueue({
        connection: redisConnection,
      });
      await withdrawQueue.add(
        WITHDRAW_QUEUE_NAME,
        {
          walletPrivateKey: decrypt(
            ctx.local.user?.encryptedPrivateKey!,
            ctx.from.id
          ).toString(),
          tokenAddress: String(ctx.session.withdraw_address),
          tokenAmount: String(ctx.session.withdraw_amount),
          priority: ctx.session.settings.trans_level,
          chain: userChain,
        },
        { removeOnComplete: true }
      );

      const queueEvents = new QueueEvents(WITHDRAW_QUEUE_NAME, {
        connection: redisConnection,
      });

      queueEvents.once('completed', async ({ returnvalue }) => {
        const _returnValue = returnvalue as unknown as IWithdrawReturnObject;

        if (!_returnValue.success) {
          return ctx.api.editMessageText(
            ctx.chat.id,
            message_id,
            ctx.t('text.transaction_fail')
          );
        }

        return ctx.api.editMessageText(
          ctx.chat.id,
          message_id,
          ctx.t('text.transaction_success', {
            hash: String(_returnValue.hash),
            transactionLink: _returnValue.transactionLink,
            balance: userDataResult.balance,
            nativeCurrency: userDataResult.nativeCurrency,
          }),
          {
            reply_markup: new InlineKeyboard()
              .text(ctx.t('label.close'), 'btn_back')
              .url(
                userChain === 'INJECTIVE'
                  ? ctx.t('label.injective_explorer')
                  : ctx.t('label.etherscan'),
                _returnValue.transactionLink
              ),
          }
        );
      });
    } catch (error) {
      ctx.logger.error(error);
    }
  }
);

// Delete wallet
feature.callbackQuery(
  'btn_delete_wallet',
  logHandle('click-delete-wallet'),
  async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.conversation.exit();
    await ctx.reply(ctx.t('text.delete_wallet'), {
      reply_markup: await deleteConfirmKeyboard(ctx),
    });
  }
);

// Go to create wallet menu
feature.callbackQuery(
  'btn_delete_confirm',
  logHandle('click-delete-confirm'),
  async (ctx) => {
    await ctx.answerCallbackQuery();
    const updatedUser = await ctx.prisma.user.update({
      where: { userId: ctx.from.id },
      data: {
        publicAddress: '',
        chain: 'ETHEREUM',
        encryptedPrivateKey: null,
      },
    });
    ctx.local.user = updatedUser;
    return createWallet(ctx);
  }
);

// Import key
feature.callbackQuery(
  'btn_import_key',
  logHandle('click-import-key'),
  async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.conversation.enter('walletImportKey');
  }
);

// Export Private key
feature.callbackQuery(
  'btn_export_key',
  logHandle('click-export-key'),
  async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.reply(ctx.t('text.export_key'), {
      reply_markup: await exportKeyKeyboard(ctx),
    });
  }
);

// Create wallet
feature.callbackQuery(
  'btn_generate_wallet',
  logHandle('click-generate-wallet'),
  async (ctx) => {
    const selectedChain = selectChainFromCtx(Chain.ETHEREUM);
    const wlt = await selectedChain.createWallet();
    const balance = await selectedChain.getBalance(wlt.address);
    await ctx.answerCallbackQuery();

    ctx.local.user = await ctx.prisma.user.update({
      where: { userId: ctx.from.id },
      data: {
        chain: Chain.ETHEREUM,
        publicAddress: wlt.address,
        encryptedPrivateKey: encrypt(wlt.privateKey, ctx.from.id),
      },
    });

    await ctx.reply(
      ctx.t('text.wallet_created', {
        address: wlt.address,
        nativeCurrency: selectedChain.nativeCurrency(),
        balance,
      }),
      { reply_markup: await welcomeKeyboard(ctx) }
    );
  }
);

// Show confirm otp
feature.callbackQuery(
  'btn_confirm_otp',
  logHandle('click-confirm-otp'),
  async (ctx) => {
    await ctx.editMessageText(
      ctx.t('text.show_private_key', {
        privateKey: decrypt(
          ctx.local.user?.encryptedPrivateKey!,
          ctx.from.id
        ).toString(),
      }),
      { reply_markup: await backKeyboard(ctx) }
    );
  }
);

// Go to sell menu
feature.callbackQuery(
  'btn_manage_positions',
  logHandle('click-manage-positions'),
  async (ctx) => {
    await ctx.answerCallbackQuery();
    await sell(ctx);
  }
);

// Go to settings menu
feature.callbackQuery(
  'btn_settings',
  logHandle('click-settings'),
  async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.reply(ctx.t('text.settings_desc'), {
      reply_markup: await settingsKeyboard(ctx),
    });
  }
);

// Go to settings menu
feature.callbackQuery('btn_help', logHandle('click-help'), async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.reply(ctx.t('text.help_desc'), {
    reply_markup: new InlineKeyboard().text(ctx.t('label.cancel'), 'btn_back'),
  });
});

export const forwardSelectChain = async (ctx: Context) => {
  ctx.session.chain = '' as Chain;
  ctx.local.user!.chain = '' as Chain;
  await ctx.reply(ctx.t('text.select_chain'), {
    reply_markup: await selectChainKeyboard(ctx),
  });
};

export const home = async (ctx: Context) => {
  if (!ctx.local.user?.publicAddress) {
    await createWallet(ctx);
  } else {
    const userChain = await getUserChain(Number(ctx.local.user?.userId));
    const userDetailsQueue = createUserDetailsQueue({
      connection: redisConnection,
    });
    const userDetailsJob = await userDetailsQueue.add(
      USER_DETAILS_QUEUE_NAME,
      {
        chain: userChain,
        userId: Number(ctx.local.user?.userId || ctx?.from?.id),
      },
      { removeOnComplete: true }
    );

    const queueEventsUserDetails = new QueueEvents(USER_DETAILS_QUEUE_NAME, {
      connection: redisConnection,
    });
    const userDataResult = await userDetailsJob.waitUntilFinished(
      queueEventsUserDetails
    );

    if (Number(userDataResult.balance)) {
      return ctx.reply(
        ctx.t('text.welcome', {
          address: ctx.local.user.publicAddress,
          balance: userDataResult.balance,
          nativeCurrency: userDataResult.nativeCurrency,
        }),
        {
          reply_markup: userChain
            ? await welcomeKeyboard(ctx)
            : await selectChainKeyboard(ctx),
        }
      );
    }
    return ctx.reply(
      ctx.t('text.welcome_wallet_empty', {
        address: ctx.local.user.publicAddress,
        nativeCurrency: userDataResult.nativeCurrency,
      }),
      {
        reply_markup: userChain
          ? await welcomeKeyboard(ctx)
          : await selectChainKeyboard(ctx),
      }
    );
  }
};

export const positionsReview = async (ctx: Context, positions: Position[]) => {
  if (!ctx.local.user?.publicAddress) {
    await createWallet(ctx);
  } else {
    const userChain = await getUserChain(Number(ctx.local.user?.userId));
    const positionsReply = positions
      .map((pos, index) =>
        ctx.t('text.single_position', {
          index: index + 1,
          ...pos,
        })
      )
      .join('\n\n');

    return ctx.reply(positionsReply, {
      reply_markup: userChain
        ? await welcomeKeyboard(ctx)
        : await selectChainKeyboard(ctx),
    });
  }
};

export const buyToken = async (ctx: Context) => {
  ctx.session.type = 'buy';
  await ctx.reply(ctx.t('text.contract_address'), {
    reply_markup: new InlineKeyboard().text(ctx.t('label.cancel'), 'btn_back'),
  });
  await ctx.conversation.exit();
  await ctx.conversation.enter('setBuyContractAddress');
};

export const settings = async (ctx: Context) => {
  await ctx.reply(ctx.t('text.settings_desc'), {
    reply_markup: await settingsKeyboard(ctx),
  });
};

feature.callbackQuery(
  'switch_chain',
  logHandle('click-switch-chain'),
  async (ctx) => {
    await ctx.answerCallbackQuery();
    await forwardSelectChain(ctx);
  }
);
