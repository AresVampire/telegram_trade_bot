import { QueueEvents } from 'bullmq';
import { formatUnits } from 'ethers';
import { InlineKeyboard } from 'grammy';

import { redisConnection } from '~/redis';
import {
  createEstimateBuyQueue,
  createTokenDetailsQueue,
  createUserDetailsQueue,
  ESTIMATE_BUY_QUEUE_NAME,
  TOKEN_DETAILS_QUEUE_NAME,
  USER_DETAILS_QUEUE_NAME,
} from '~/workers';

import { getUserChain } from '../helpers/getUserChain';
import { isNumeric, selectChain, selectChainFromCtx } from '../helpers/utils';
import { buyTokenConfirmKeyboard, buyTokenKeyboard } from '../keyboards';
import { Context, Conversation } from '../types';

export async function setBuyContractAddress(
  conversation: Conversation,
  newCtx: Context
) {
  const {
    message,
    conversation: ctxConversation,
    session,
    logger,
  } = await conversation.wait();

  if (message?.text !== undefined && !message?.text.startsWith('/')) {
    const contractAddress = message.text;
    try {
      const selectedChain = await selectChain(
        Number(newCtx.local.user?.userId)
      );
      const userChain = await getUserChain(
        Number(newCtx.local.user?.userId)
      );
      const isValidErc20 = await selectedChain.isValidContract(contractAddress);

      if (!isValidErc20) {
        throw new Error(
          `invalid contract: ${contractAddress} for chain ${userChain}`
        );
      }
      const tokenDetailsQueue = createTokenDetailsQueue({
        connection: redisConnection,
      });
      const userDetailsQueue = createUserDetailsQueue({
        connection: redisConnection,
      });

      const tokenDetailsJob = await tokenDetailsQueue.add(
        TOKEN_DETAILS_QUEUE_NAME,
        {
          chain: userChain,
          tokenAddress: contractAddress,
        }
      );

      const userDetailsJob = await userDetailsQueue.add(
        USER_DETAILS_QUEUE_NAME,
        {
          chain: userChain,
          userId: Number(newCtx.local.user?.userId || newCtx.from?.id),
        }
      );

      const queueEventsTokenDetails = new QueueEvents(
        TOKEN_DETAILS_QUEUE_NAME,
        { connection: redisConnection }
      );

      const queueEventsUserDetails = new QueueEvents(USER_DETAILS_QUEUE_NAME, {
        connection: redisConnection,
      });

      const tokenDataResult = await tokenDetailsJob.waitUntilFinished(
        queueEventsTokenDetails
      );
      const userDataResult = await userDetailsJob.waitUntilFinished(
        queueEventsUserDetails
      );

      if (!tokenDataResult?.success || !userDataResult?.success) {
        throw new Error();
      }

      const { mcap, tokenName, tokenPrice } = tokenDataResult;
      const { balance, nativeCurrency } = userDataResult;

      session.token_price = tokenPrice;
      session.token_address = contractAddress;
      session.token_name = tokenName;

      if (Number(newCtx.session.settings.auto_status) === 1) {
        await newCtx.reply(
          newCtx.t('text.contract_detail', {
            tokenName,
            contractAddress,
            tokenPrice,
            marketCap: mcap,
            nativeCurrency,
            balance,
          }),
          { reply_markup: await buyTokenKeyboard(newCtx) }
        );

        return ctxConversation.enter('contractAutoBuyTokenAmount');
      }

      return newCtx.reply(
        newCtx.t('text.contract_detail', {
          tokenName,
          contractAddress,
          tokenPrice,
          marketCap: mcap,
          nativeCurrency,
          balance,
        }),
        { reply_markup: await buyTokenKeyboard(newCtx) }
      );
    } catch (error) {
      logger.error(error);
      await newCtx.reply(newCtx.t('text.invalid_address'), {
        reply_markup: new InlineKeyboard().text(
          newCtx.t('label.cancel'),
          'btn_back'
        ),
      });
      await ctxConversation.enter('setBuyContractAddress');
    }
  }
}

export async function contractBuyTokenAmount(
  conversation: Conversation,
  newCtx: Context
) {
  const {
    message,
    conversation: ctxConversation,
    session,
    local,
  } = await conversation.wait();

  const userChain = await getUserChain(Number(local.user?.userId));

  if (message?.text !== undefined && !message?.text.startsWith('/')) {
    try {
      if (!isNumeric(message.text) || Number(message.text) === 0) {
        throw new Error();
      }
      const tokenAmount = message.text;
      const userDetailsQueue = createUserDetailsQueue({
        connection: redisConnection,
      });
      const userDetailsJob = await userDetailsQueue.add(
        USER_DETAILS_QUEUE_NAME,
        {
          chain: userChain,
          userId: Number(newCtx.local.user?.userId || newCtx?.from?.id),
        },
        { removeOnComplete: true }
      );

      const queueEventsUserDetails = new QueueEvents(USER_DETAILS_QUEUE_NAME, {
        connection: redisConnection,
      });
      const userDataResult = await userDetailsJob.waitUntilFinished(
        queueEventsUserDetails
      );

      const estimateBuyQueue = createEstimateBuyQueue({
        connection: redisConnection,
      });
      const estimateBuyJob = await estimateBuyQueue.add(
        ESTIMATE_BUY_QUEUE_NAME,
        {
          chain: userChain,
          userPublicAddress: String(newCtx.local.user?.publicAddress),
          tokenAmount,
          tokenAddress: String(newCtx.session.token_address),
          buySlippage: String(newCtx.session.settings.slippage_buy),
          userBalance: String(userDataResult.balance),
        }
      );

      const queueEvents = new QueueEvents(ESTIMATE_BUY_QUEUE_NAME, {
        connection: redisConnection,
      });
      const estimateBuyResult =
        await estimateBuyJob.waitUntilFinished(queueEvents);

      if (!estimateBuyResult.success && estimateBuyResult.reason === 'ERROR') {
        throw new Error();
      }

      if (
        !estimateBuyResult.success &&
        estimateBuyResult.reason === 'LOW_BALANCE'
      ) {
        await newCtx.reply(
          newCtx.t('text.invalid_amount_too_high', { amount: tokenAmount }),
          {
            reply_markup: new InlineKeyboard().text(
              newCtx.t('label.cancel'),
              'btn_back'
            ),
          }
        );

        return ctxConversation.enter('contractBuyTokenAmount', {
          overwrite: true,
        });
      }

      session.token_amount = tokenAmount;
      const { address, amount, currency, currencyamt, gas } = estimateBuyResult;
      const nativeCurrency = selectChainFromCtx(userChain).nativeCurrency();
      const decimals = await selectChainFromCtx(userChain).getDecimals(
        String(newCtx.session.token_address)
      );

      return newCtx.reply(
        newCtx.t('text.confirm_buy_transaction', {
          address,
          amount: `${formatUnits(amount, decimals)} ${newCtx.session.token_name}`,
          currency,
          currencyamt,
          nativeCurrency,
          gas,
        }),
        { reply_markup: await buyTokenConfirmKeyboard(newCtx) }
      );
    } catch (e) {
      await newCtx.reply(newCtx.t('text.invalid_amount'), {
        reply_markup: new InlineKeyboard().text(
          newCtx.t('label.cancel'),
          'btn_back'
        ),
      });
      return ctxConversation.enter('contractBuyTokenAmount', {
        overwrite: true,
      });
    }
  }
}

export async function contractAutoBuyTokenAmount(
  conversation: Conversation,
  ctx: Context
) {
  try {
    const userChain = await getUserChain(Number(ctx.local.user?.userId));
    const autoBuyValue = conversation.session.settings.auto_value;
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

    if (
      Number(autoBuyValue) !== 0 &&
      Number(autoBuyValue) < Number(userDataResult.balance)
    ) {
      conversation.session.token_amount = String(autoBuyValue);

      const estimateBuyQueue = createEstimateBuyQueue({
        connection: redisConnection,
      });
      const estimateBuyJob = await estimateBuyQueue.add(
        ESTIMATE_BUY_QUEUE_NAME,
        {
          chain: userChain,
          userPublicAddress: String(ctx.local.user?.publicAddress),
          tokenAmount: String(autoBuyValue),
          tokenAddress: String(conversation.session.token_address),
          buySlippage: String(conversation.session.settings.slippage_buy),
          userBalance: String(userDataResult.balance),
        }
      );

      const queueEvents = new QueueEvents(ESTIMATE_BUY_QUEUE_NAME, {
        connection: redisConnection,
      });
      const estimateBuyResult = await estimateBuyJob.waitUntilFinished(queueEvents);

      if (!estimateBuyResult.success && estimateBuyResult.reason === 'ERROR') {
        throw new Error();
      }

      if (!estimateBuyResult.success && estimateBuyResult.reason === 'LOW_BALANCE') {
        return ctx.reply(
          ctx.t('text.invalid_amount_too_high', {
            amount: autoBuyValue,
            balance: userDataResult.balance,
            nativeCurrency: userDataResult.nativeCurrency,
          }),
          {
            reply_markup: new InlineKeyboard().text(
              ctx.t('label.cancel'),
              'btn_back'
            ),
          }
        );
      }
      const { address, amount, currency, currencyamt, gas } = estimateBuyResult;
      const nativeCurrency = selectChainFromCtx(userChain).nativeCurrency();
      return ctx.reply(
        ctx.t('text.confirm_buy_transaction', {
          address,
          amount,
          currency,
          currencyamt,
          nativeCurrency,
          gas,
        }),
        { reply_markup: await buyTokenConfirmKeyboard(ctx) }
      );
    }
    await ctx.reply(
      ctx.t('text.invalid_amount_too_high', {
        amount: autoBuyValue,
        balance: userDataResult.balance,
        nativeCurrency: userDataResult.nativeCurrency,
      }),
      {
        reply_markup: new InlineKeyboard().text(
          ctx.t('label.cancel'),
          'btn_back'
        ),
      }
    );
  } catch (e) {
    await ctx.reply(ctx.t('text.invalid_amount'), {
      reply_markup: new InlineKeyboard().text(
        ctx.t('label.cancel'),
        'btn_back'
      ),
    });
  }
}
