import { QueueEvents } from 'bullmq';
import { formatUnits } from 'ethers';
import { InlineKeyboard } from 'grammy';

import { decrypt, isNumeric, selectChain } from '~/bot/helpers/utils';
import { sellTokenConfirmKeyboard, sellTokenKeyboard } from '~/bot/keyboards';
import { Context, Conversation } from '~/bot/types';
import { redisConnection } from '~/redis';
import {
  createSellTokenGasQueue,
  createTokenDetailsQueue,
  createUserDetailsQueue,
  ISellTokenGasReturnObject,
  SELL_TOKEN_GAS_QUEUE_NAME,
  TOKEN_DETAILS_QUEUE_NAME,
  USER_DETAILS_QUEUE_NAME,
} from '~/workers';

import { getUserChain } from '../helpers/getUserChain';

export async function setSellContractAddress(
  conversation: Conversation,
  ctx: Context
) {
  const newCtx = await conversation.wait();
  const { message } = newCtx;

  try {
    if (message?.text === undefined || message?.text.startsWith('/')) {
      throw new Error();
    }

    const contractAddress = String(message.text);

    const selectedChain = await selectChain(Number(newCtx.local.user?.userId));
    const isValidErc20 = await selectedChain.isValidContract(contractAddress);
    const userChain = await getUserChain(Number(ctx.local.user?.userId));

    if (!isValidErc20) {
      throw new Error();
    }

    const tokenDetailsQueue = createTokenDetailsQueue({
      connection: redisConnection,
    });
    const tokenDetailsJob = await tokenDetailsQueue.add(
      TOKEN_DETAILS_QUEUE_NAME,
      {
        chain: userChain,
        tokenAddress: contractAddress,
      },
      { removeOnComplete: true }
    );

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

    const queueEventsTokenDetails = new QueueEvents(TOKEN_DETAILS_QUEUE_NAME, {
      connection: redisConnection,
    });
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

    newCtx.session.token_price = tokenPrice;
    newCtx.session.token_address = contractAddress;
    newCtx.session.token_name = tokenName;

    return newCtx.reply(
      newCtx.t('text.contract_detail', {
        tokenName,
        contractAddress,
        tokenPrice,
        marketCap: mcap,
        balance,
        nativeCurrency,
      }),
      { reply_markup: await sellTokenKeyboard(ctx) }
    );
  } catch (error) {
    newCtx.logger.error(error);
    await newCtx.reply(ctx.t('text.invalid_address'), {
      reply_markup: new InlineKeyboard().text(
        ctx.t('label.cancel'),
        'btn_back'
      ),
    });
    return newCtx.conversation.enter('setSellContractAddress');
  }
}

export async function setPositionSellTokenValue(
  conversation: Conversation,
  ctx: Context
) {
  const { message, logger, local, session } = await conversation.wait();

  try {
    if (message?.text === undefined || message?.text.startsWith('/')) {
      throw new Error();
    }

    const value = String(message?.text);

    if (!isNumeric(value) || Number(value) > 100) {
      throw new Error();
    }

    const selectedChain = await selectChain(Number(local.user?.userId));
    const userChain = await getUserChain(Number(ctx.local.user?.userId));

    const tokenBalance = await selectedChain.getValue(
      String(local.user?.publicAddress),
      String(session.token_address)
    );
    const tokenDecimals = await selectedChain.getDecimals(
      String(session.token_address)
    );

    session.token_amount =
      Number(value) < 100
        ? formatUnits(
            BigInt(Number(tokenBalance) * (Number(value) / 100)),
            tokenDecimals
          )
        : formatUnits(tokenBalance, tokenDecimals);

    const tokenPrice = await selectedChain.getTokenPrice(
      String(session.token_address)
    );

    const sellTokenCurrency = await selectedChain.getTokenSymbol(
      session.token_address!
    );

    if (tokenPrice === 'error') {
      throw new Error();
    }

    const sellTokenGasQueue = createSellTokenGasQueue({
      connection: redisConnection,
    });
    await sellTokenGasQueue.add(SELL_TOKEN_GAS_QUEUE_NAME, {
      chain: userChain,
      sellSlippage: String(session.settings.slippage_sell),
      userPKey: decrypt(
        local.user?.encryptedPrivateKey!,
        ctx.from?.id
      ).toString(),
      userPublicAddress: String(local.user?.publicAddress),
      tokenAmount: String(session.token_amount),
      tokenAddress: String(session.token_address),
    });

    const queueEvents = new QueueEvents(SELL_TOKEN_GAS_QUEUE_NAME, {
      connection: redisConnection,
    });

    queueEvents.once('completed', async ({ returnvalue }) => {
      const _returnValue = returnvalue as unknown as ISellTokenGasReturnObject;

      if (!_returnValue.success) {
        throw new Error();
      }

      return ctx.reply(
        ctx.t('text.confirm_sell_transaction', {
          address: session.token_address as string,
          amount: session.token_amount as string,
          sellTokenCurrency,
          currency: selectedChain.nativeCurrency(),
          currencyamt: Number(session.token_amount) * Number(tokenPrice),
          gas: _returnValue.gas,
        }),
        { reply_markup: await sellTokenConfirmKeyboard(ctx) }
      );
    });
  } catch (error) {
    logger.error(error);
    await ctx.reply(ctx.t('text.invalid_amount_percentage'), {
      reply_markup: new InlineKeyboard().text(
        ctx.t('label.cancel'),
        'btn_back'
      ),
    });
    return ctx.conversation.enter('setPositionSellTokenValue');
  }
}

export async function contractSellTokenAmount(
  conversation: Conversation,
  ctx: Context
) {
  const { message, session, local, logger } = await conversation.wait();

  const selectedChain = await selectChain(Number(local.user?.userId));
  const userChain = await getUserChain(Number(ctx.local.user?.userId));

  try {
    if (message?.text === undefined || message?.text.startsWith('/')) {
      throw new Error();
    }

    const tokenAmount = String(message?.text);

    if (!isNumeric(tokenAmount)) {
      throw new Error();
    }

    session.token_amount = tokenAmount;

    const sellTokenGasQueue = createSellTokenGasQueue({
      connection: redisConnection,
    });
    await sellTokenGasQueue.add(SELL_TOKEN_GAS_QUEUE_NAME, {
      chain: userChain,
      sellSlippage: String(session.settings.slippage_sell),
      userPKey: decrypt(
        local.user?.encryptedPrivateKey!,
        ctx.from?.id
      ).toString(),
      userPublicAddress: String(ctx.local.user?.publicAddress),
      tokenAmount,
      tokenAddress: String(ctx.session.token_address),
    });

    const queueEvents = new QueueEvents(SELL_TOKEN_GAS_QUEUE_NAME, {
      connection: redisConnection,
    });

    queueEvents.once('completed', async ({ returnvalue }) => {
      const _returnValue = returnvalue as unknown as ISellTokenGasReturnObject;

      if (!_returnValue.success) {
        throw new Error();
      }

      // @ts-ignore
      const { amount: estimation } = await selectedChain.estimateSell(
        tokenAmount,
        session.token_address as string
      );

      const nativeCurrency = selectedChain.nativeCurrency();

      return ctx.reply(
        ctx.t('text.confirm_buy_transaction', {
          address: session.token_address as string,
          amount: estimation,
          currency: String(session.token_name),
          nativeCurrency,
          currencyamt: tokenAmount,
          gas: _returnValue.gas,
        }),
        { reply_markup: await sellTokenConfirmKeyboard(ctx) }
      );
    });
  } catch (error) {
    logger.error(error);
    await ctx.reply(ctx.t('text.invalid_amount'), {
      reply_markup: new InlineKeyboard().text(
        ctx.t('label.cancel'),
        'btn_back'
      ),
    });
    return ctx.conversation.enter('contractSellTokenAmount');
  }
}
