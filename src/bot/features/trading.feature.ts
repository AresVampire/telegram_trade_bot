import { QueueEvents } from 'bullmq';
import { formatUnits } from 'ethers';
import { Composer, InlineKeyboard } from 'grammy';

import { logHandle } from '~/bot/helpers/logging';
import { decrypt, isNumeric, selectChainFromCtx } from '~/bot/helpers/utils';
import { Context } from '~/bot/types';
import { redisConnection } from '~/redis';
import {
  BUY_QUEUE_NAME,
  createBuyQueue,
  createEstimateBuyQueue,
  createUserDetailsQueue,
  ESTIMATE_BUY_QUEUE_NAME,
  IBuyReturnObject,
  USER_DETAILS_QUEUE_NAME,
} from '~/workers';

import { getUserChain } from '../helpers/getUserChain';
import {
  buyTokenAfterErrorKeyboard,
  buyTokenConfirmKeyboard,
} from '../keyboards';

export const composer = new Composer<Context>();

const feature = composer.chatType('private');

feature.callbackQuery(
  'btn_buy_token',
  logHandle('click-buy-token'),
  async (ctx) => {
    await ctx.answerCallbackQuery();
    ctx.session.type = 'buy';
    await ctx.reply(ctx.t('text.contract_address'), {
      reply_markup: new InlineKeyboard().text(
        ctx.t('label.cancel'),
        'btn_back'
      ),
    });

    await ctx.conversation.exit();
    await ctx.conversation.enter('setBuyContractAddress');
  }
);

feature.callbackQuery(
  'buy_select_token',
  logHandle('click-buy-select-token'),
  async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.reply(
      ctx.t('text.token_amount', {
        tokenName: ctx.session.token_name as string,
      }),
      {
        reply_markup: new InlineKeyboard().text(
          ctx.t('label.cancel'),
          'btn_back'
        ),
      }
    );
    await ctx.conversation.exit();
    await ctx.conversation.enter('contractBuyTokenAmount');
  }
);

feature.callbackQuery(
  /^buy_amount_token:/,
  logHandle('click-buy-amount-token'),
  async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.editMessageReplyMarkup({
      reply_markup: new InlineKeyboard().text(
        ctx.t('label.cancel'),
        'btn_back'
      ),
    });

    const { data } = ctx.callbackQuery;
    const value = data.split(':')[1];

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

    if (!userDataResult?.success) {
      throw new Error();
    }

    const { balance, nativeCurrency } = userDataResult;

    if (value === 'X') {
      await ctx.reply(
        ctx.t('text.token_amount', {
          tokenName: ctx.session.token_name as string,
          nativeCurrency,
        }),
        {
          reply_markup: new InlineKeyboard().text(
            ctx.t('label.cancel'),
            'btn_back'
          ),
        }
      );
      await ctx.conversation.exit();
      await ctx.conversation.enter('contractBuyTokenAmount');
      return;
    }

    try {
      if (
        isNumeric(value) &&
        Number(value) !== 0 &&
        Number(value) < Number(balance)
      ) {
        const tokenAmount = value;

        const estimateBuyQueue = createEstimateBuyQueue({
          connection: redisConnection,
        });
        const estimateBuyJob = await estimateBuyQueue.add(
          ESTIMATE_BUY_QUEUE_NAME,
          {
            chain: userChain,
            userPublicAddress: String(ctx.local.user?.publicAddress),
            tokenAmount,
            tokenAddress: String(ctx.session.token_address),
            buySlippage: String(ctx.session.settings.slippage_buy),
            userBalance: String(balance),
          }
        );

        const queueEvents = new QueueEvents(ESTIMATE_BUY_QUEUE_NAME, {
          connection: redisConnection,
        });
        const estimateBuyResult =
          await estimateBuyJob.waitUntilFinished(queueEvents);

        if (
          !estimateBuyResult.success &&
          estimateBuyResult.reason === 'ERROR'
        ) {
          throw new Error(
            `could not estimate buy for ${ctx.session.token_address} on ${userChain}`
          );
        }

        if (
          !estimateBuyResult.success &&
          estimateBuyResult.reason === 'LOW_BALANCE'
        ) {
          return ctx.reply(
            ctx.t('text.invalid_amount_too_high', { amount: value }),
            { reply_markup: await buyTokenAfterErrorKeyboard(ctx) }
          );
        }

        const nativeCurrency = selectChainFromCtx(userChain).nativeCurrency();
        const decimals = await selectChainFromCtx(userChain).getDecimals(
          String(ctx.session.token_address)
        );

        ctx.session.token_amount = tokenAmount;
        const { address, amount, currency, currencyamt, gas } =
          estimateBuyResult;

        await ctx.reply(
          ctx.t('text.confirm_buy_transaction', {
            address,
            amount: `${formatUnits(amount, decimals)} ${ctx.session.token_name}`,
            currency,
            currencyamt,
            nativeCurrency,
            gas,
          }),
          { reply_markup: await buyTokenConfirmKeyboard(ctx) }
        );
      } else {
        await ctx.reply(
          ctx.t('text.invalid_amount_too_high', {
            amount: value,
            balance,
            nativeCurrency,
          }),
          { reply_markup: await buyTokenAfterErrorKeyboard(ctx) }
        );
      }
    } catch (e) {
      if (value === 'X') {
        await ctx.reply(ctx.t('text.invalid_amount'), {
          reply_markup: new InlineKeyboard().text(
            ctx.t('label.cancel'),
            'btn_back'
          ),
        });
      } else {
        await ctx.reply(ctx.t('text.invalid_amount'), {
          reply_markup: await buyTokenAfterErrorKeyboard(ctx),
        });
      }
    }
  }
);

feature.callbackQuery(
  'btn_buy_confirm',
  logHandle('click-buy-select-confirm'),
  async (ctx) => {
    try {
      await ctx.answerCallbackQuery();
      await ctx.editMessageReplyMarkup({
        reply_markup: new InlineKeyboard().text(
          ctx.t('label.cancel'),
          'btn_back'
        ),
      });

      const { message_id } = await ctx.reply(ctx.t('text.sending'));

      const userChain = await getUserChain(Number(ctx.local.user?.userId));

      const buyQueue = createBuyQueue({ connection: redisConnection });
      await buyQueue.add(
        BUY_QUEUE_NAME,
        {
          walletPrivateKey: decrypt(
            ctx.local.user?.encryptedPrivateKey!,
            ctx.from.id
          ).toString(),
          userPublicAddress: String(ctx.local.user?.publicAddress),
          buySlippage: String(ctx.session.settings.slippage_buy),
          userId: Number(ctx.from?.id),
          tokenAddress: String(ctx.session.token_address),
          tokenAmount: String(ctx.session.token_amount),
          tokenPrice: String(ctx.session.token_price),
          tokenName: String(ctx.session.token_name),
          priority: ctx.session.settings.trans_level,
          chain: userChain,
        },
        { removeOnComplete: true }
      );

      const queueEvents = new QueueEvents(BUY_QUEUE_NAME, {
        connection: redisConnection,
      });
      queueEvents.once('completed', async ({ returnvalue }) => {
        const _returnValue = returnvalue as unknown as IBuyReturnObject;
        if (!_returnValue.success) {
          return ctx.api.editMessageText(
            ctx.chat?.id,
            message_id,
            ctx.t('text.transaction_failed')
          );
        }

        return ctx.api.editMessageText(
          ctx.chat?.id,
          message_id,
          ctx.t('text.transaction_sent', { tx: _returnValue.tx }),
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

feature.callbackQuery(
  'btn_buy_cancel',
  logHandle('click-buy-cancel'),
  async (ctx) => {
    try {
      await ctx.answerCallbackQuery();
      await ctx.deleteMessage();
    } catch (error) {
      ctx.logger.error(error);
    }
  }
);
