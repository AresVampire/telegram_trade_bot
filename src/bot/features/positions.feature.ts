import { QueueEvents } from 'bullmq';
import { formatUnits } from 'ethers';
import { Composer, InlineKeyboard } from 'grammy';

import { logHandle } from '~/bot/helpers/logging';
import {
  decrypt,
  isNumeric,
  selectChain,
  selectChainFromCtx,
} from '~/bot/helpers/utils';
import {
  buyTokenKeyboard,
  sellManageKeyboard,
  sellTokenConfirmKeyboard,
} from '~/bot/keyboards';
import { Context } from '~/bot/types';
import { redisConnection } from '~/redis';
import {
  createSellQueue,
  createSellTokenGasQueue,
  createTokenDetailsQueue,
  createUserDetailsQueue,
  ISellReturnObject,
  ISellTokenGasReturnObject,
  SELL_QUEUE_NAME,
  SELL_TOKEN_GAS_QUEUE_NAME,
  TOKEN_DETAILS_QUEUE_NAME,
  USER_DETAILS_QUEUE_NAME,
} from '~/workers';
import {
  createSellListQueue,
  SELL_LIST_QUEUE_NAME,
} from '~/workers/sell-list.worker';

import { getUserChain } from '../helpers/getUserChain';
import { getHashedAddress } from '../helpers/hashAddress';
import { buyToken } from './wallet.feature';

export const composer = new Composer<Context>();

const feature = composer.chatType('private');

// Show list of positions
feature.callbackQuery(
  /^btn_select_position:/,
  logHandle('click-select-position'),
  async (ctx) => {
    try {
      await ctx.answerCallbackQuery();
      await ctx.replyWithChatAction('typing');
      const tokenName = ctx.callbackQuery.data.split(':')[1];

      const userChain = await getUserChain(Number(ctx.local.user?.userId));

      const sellListQueue = createSellListQueue({
        connection: redisConnection,
      });
      await sellListQueue.add(SELL_LIST_QUEUE_NAME, {
        tokenAddress: tokenName,
        userPublicAddress: ctx.local.user?.publicAddress!,
        chain: userChain,
      });

      const queueEvents = new QueueEvents(SELL_LIST_QUEUE_NAME, {
        connection: redisConnection,
      });

      queueEvents.once('completed', async ({ returnvalue }) => {
        const _returnvalue = returnvalue as unknown as { address: string };
        ctx.session.token_address = tokenName;

        return ctx.reply(ctx.t('text.position_detail', _returnvalue), {
          reply_markup: await sellManageKeyboard(ctx, _returnvalue),
        });
      });
    } catch (error) {
      ctx.logger.error(error);
    }
  }
);

// Refresh position
feature.callbackQuery(
  /^btn_refresh_position:/,
  logHandle('click-refresh-position'),
  async (ctx) => {
    try {
      await ctx.answerCallbackQuery();
      await ctx.replyWithChatAction('typing');

      const userChain = await getUserChain(Number(ctx.local.user?.userId));

      const tokenAddress = await getHashedAddress(
        ctx.callbackQuery.data.split(':')[1]
      );

      const sellListQueue = createSellListQueue({
        connection: redisConnection,
      });
      await sellListQueue.add(SELL_LIST_QUEUE_NAME, {
        tokenAddress: tokenAddress,
        userPublicAddress: ctx.local.user?.publicAddress!,
        chain: userChain,
      });

      const queueEvents = new QueueEvents(SELL_LIST_QUEUE_NAME, {
        connection: redisConnection,
      });

      queueEvents.once('completed', async ({ returnvalue }) => {
        const _returnvalue = returnvalue as unknown as { address: string };
        ctx.session.token_address = tokenAddress;

        return ctx.editMessageText(
          ctx.t('text.position_detail', _returnvalue),
          { reply_markup: await sellManageKeyboard(ctx, _returnvalue) }
        );
      });
    } catch (error) {
      ctx.logger.error(error);
    }
  }
);

// Single position
feature.callbackQuery(
  /^single_position:/,
  logHandle('click-single-position'),
  async (ctx) => {
    try {
      await ctx.answerCallbackQuery();
      await ctx.replyWithChatAction('typing');
      const tokenAddress = await getHashedAddress(
        ctx.callbackQuery.data.split(':')[1]
      );

      const userChain = await getUserChain(Number(ctx.local.user?.userId));

      const sellListQueue = createSellListQueue({
        connection: redisConnection,
      });
      await sellListQueue.add(SELL_LIST_QUEUE_NAME, {
        tokenAddress: tokenAddress,
        userPublicAddress: ctx.local.user?.publicAddress!,
        chain: userChain,
      });

      const queueEvents = new QueueEvents(SELL_LIST_QUEUE_NAME, {
        connection: redisConnection,
      });

      queueEvents.once('completed', async ({ returnvalue }) => {
        const _returnvalue = returnvalue as unknown as { address: string };
        ctx.session.token_address = tokenAddress;

        return ctx.reply(ctx.t('text.position_detail', _returnvalue), {
          reply_markup: await sellManageKeyboard(ctx, _returnvalue),
        });
      });
    } catch (error) {
      ctx.logger.error(error);
    }
  }
);

feature.callbackQuery(
  'btn_sell_token',
  logHandle('click-sell-token'),
  async (ctx) => {
    ctx.session.type = 'sell';
    await ctx.reply(ctx.t('text.contract_address'));
    await ctx.conversation.exit();
    await ctx.conversation.enter('setSellContractAddress');
  }
);

feature.callbackQuery(
  /^btn_sell_x:/,
  logHandle('click-sell-token'),
  async (ctx) => {
    try {
      await ctx.answerCallbackQuery();
      const params = ctx.callbackQuery.data.split(':');
      ctx.session.type = 'sell';

      const token_address = await getHashedAddress(params[2]);

      ctx.session.token_address = token_address;
      ctx.session.token_amount = params[1];

      if (params[1] === 'Y') {
        await ctx.reply(ctx.t('text.token_percentage'), {
          reply_markup: new InlineKeyboard().text(
            ctx.t('label.cancel'),
            'btn_back'
          ),
        });
        await ctx.conversation.exit();
        await ctx.conversation.enter('setPositionSellTokenValue');
      } else {
        await ctx.reply(ctx.t('text.token_value'), {
          reply_markup: new InlineKeyboard().text(
            ctx.t('label.cancel'),
            'btn_back'
          ),
        });
        await ctx.conversation.exit();
        await ctx.conversation.enter('setPositionSellTokenValueAmount');
      }
    } catch (error) {
      ctx.logger.error(error);
    }
  }
);

feature.callbackQuery(
  /^btn_sell_pg:/,
  logHandle('click-sell-token-percent'),
  async (ctx) => {
    const selectedChain = await selectChain(Number(ctx.local.user?.userId));
    const userChain = await getUserChain(Number(ctx.local.user?.userId));
    try {
      await ctx.answerCallbackQuery();
      const params = ctx.callbackQuery.data.split(':');
      ctx.session.type = 'sell';
      const token_amount = params[1];
      const token_address_hash = params[2];
      const foundAddressHash = await ctx.prisma.addressHashMap.findFirst({
        where: { hash: token_address_hash },
      });

      if (!foundAddressHash) {
        throw new Error('TOKEN_ADDRESS_NOT_FOUND');
      }

      const token_address = foundAddressHash.address;
      ctx.session.token_address = token_address;

      if (isNumeric(token_amount) && Number(token_amount) <= 100) {
        try {
          const tokenBalance = await selectedChain.getValue(
            String(ctx.local.user?.publicAddress),
            token_address
          );

          const tokenDecimals = await selectedChain.getDecimals(
            String(token_address)
          );

          ctx.session.token_amount =
            Number(token_amount) < 100
              ? formatUnits(
                  BigInt(
                    Math.floor(
                      Number(tokenBalance) * (Number(token_amount) / 100)
                    )
                  ),
                  tokenDecimals
                )
              : formatUnits(tokenBalance, tokenDecimals);

          const tokenPrice = await selectedChain.getTokenPrice(token_address);
          const sellTokenCurrency =
            await selectedChain.getTokenSymbol(token_address);

          if (tokenPrice === 'error') {
            throw new Error();
          }

          const tokenSellGasQueue = createSellTokenGasQueue({
            connection: redisConnection,
          });
          await tokenSellGasQueue.add(SELL_TOKEN_GAS_QUEUE_NAME, {
            chain: userChain,
            sellSlippage: String(ctx.session.settings.slippage_sell),
            userPKey: decrypt(
              ctx?.local?.user?.encryptedPrivateKey!,
              ctx.from?.id
            ).toString(),
            userPublicAddress: String(ctx.local.user?.publicAddress),
            tokenAmount: String(ctx.session.token_amount),
            tokenAddress: String(token_address),
          });

          const queueEvents = new QueueEvents(SELL_TOKEN_GAS_QUEUE_NAME, {
            connection: redisConnection,
          });
          queueEvents.once('completed', async ({ returnvalue }) => {
            const _returnValue =
              returnvalue as unknown as ISellTokenGasReturnObject;

            if (!_returnValue.success) {
              throw new Error();
            }

            const estimatedSellValue = await selectedChain.estimateSell(
              String(ctx.session.token_amount),
              String(token_address)
            );

            if (estimatedSellValue === 'error') {
              throw new Error();
            }

            // @ts-ignore
            const outAmount = formatUnits(estimatedSellValue.rawAmountOut, 18);

            return ctx.reply(
              ctx.t('text.confirm_sell_transaction', {
                address: String(token_address),
                amount: String(ctx.session.token_amount),
                currency: selectedChain.nativeCurrency(),
                sellTokenCurrency: sellTokenCurrency,
                currencyamt: outAmount,
                gas: _returnValue.gas,
              }),
              { reply_markup: await sellTokenConfirmKeyboard(ctx) }
            );
          });
        } catch (error) {
          ctx.logger.error(error);
        }
      } else {
        await ctx.reply(ctx.t('text.invalid_amount_percentage'), {
          reply_markup: new InlineKeyboard().text(
            ctx.t('label.cancel'),
            'btn_back'
          ),
        });
      }
    } catch (error) {
      ctx.logger.error(error);
    }
  }
);

feature.callbackQuery(
  'sell_select_token',
  logHandle('click-sell-select-token'),
  async (ctx) => {
    await ctx.reply(
      ctx.t('text.sell_token_amount', {
        tokenName: ctx.session.token_name as string,
      })
    );
    await ctx.conversation.exit();
    await ctx.conversation.enter('contractSellTokenAmount');
  }
);

feature.callbackQuery(
  'btn_sell_confirm',
  logHandle('click-sell-select-confirm'),
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

      const { message_id } = await ctx.reply(ctx.t('text.sending'));

      const sellQueue = createSellQueue({ connection: redisConnection });
      await sellQueue.add(
        SELL_QUEUE_NAME,
        {
          walletPrivateKey: decrypt(
            ctx.local.user?.encryptedPrivateKey!,
            ctx.from.id
          ).toString(),
          tokenAddress: String(ctx.session.token_address),
          tokenAmount: String(ctx.session.token_amount),
          userPublicAddress: String(ctx.local.user?.publicAddress),
          sellSlippage: String(ctx.session.settings.slippage_sell),
          userId: Number(ctx.from?.id),
          priority: ctx.session.settings.trans_level,
          chain: userChain,
        },
        { removeOnComplete: true }
      );

      const queueEvents = new QueueEvents(SELL_QUEUE_NAME, {
        connection: redisConnection,
      });

      queueEvents.once('completed', async ({ returnvalue }) => {
        const _returnValue = returnvalue as unknown as ISellReturnObject;

        if (!_returnValue.success) {
          return ctx.api.editMessageText(
            ctx.chat.id,
            message_id,
            ctx.t('text.transaction_failed')
          );
        }

        return ctx.api.editMessageText(
          ctx.chat.id,
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
  'btn_buy_more',
  logHandle('click-buy-more'),
  async (ctx) => {
    await ctx.answerCallbackQuery();
    await buyToken(ctx);
  }
);

feature.callbackQuery(
  'btn_sell_cancel',
  logHandle('click-sell-cancel'),
  async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.deleteMessage();
  }
);

feature.callbackQuery(
  'btn_buy_more_position',
  logHandle('click-buy-more-position'),
  async (ctx) => {
    try {
      await ctx.answerCallbackQuery();

      const userChain = await getUserChain(Number(ctx.local.user?.userId));

      const tokenDetailsQueue = createTokenDetailsQueue({
        connection: redisConnection,
      });
      const tokenDetailsJob = await tokenDetailsQueue.add(
        TOKEN_DETAILS_QUEUE_NAME,
        {
          chain: userChain,
          tokenAddress: String(ctx.session.token_address),
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

      ctx.session.token_price = tokenPrice;
      ctx.session.token_name = tokenName;

      await ctx.reply(
        ctx.t('text.contract_detail', {
          tokenName,
          contractAddress: String(ctx.session.token_address),
          tokenPrice,
          marketCap: String(mcap),
          balance,
          nativeCurrency,
        }),
        { reply_markup: await buyTokenKeyboard(ctx) }
      );
    } catch (error) {
      await ctx.reply(ctx.t('text.invalid_address'), {
        reply_markup: new InlineKeyboard().text(
          ctx.t('label.cancel'),
          'btn_back'
        ),
      });
    }
  }
);

feature.callbackQuery(
  /^btn_sell_position:/,
  logHandle('click-sell-position'),
  async (ctx) => {
    await ctx.answerCallbackQuery();
    const tokenName = ctx.callbackQuery.data.split(':')[1];

    const userChain = await getUserChain(Number(ctx.local.user?.userId));

    const sellListQueue = createSellListQueue({ connection: redisConnection });
    await sellListQueue.add(SELL_LIST_QUEUE_NAME, {
      tokenAddress: tokenName,
      userPublicAddress: ctx.local.user?.publicAddress!,
      chain: userChain,
    });

    const queueEvents = new QueueEvents(SELL_LIST_QUEUE_NAME, {
      connection: redisConnection,
    });

    queueEvents.once('completed', async ({ returnvalue }) => {
      const _returnvalue = returnvalue as unknown as { address: string };
      ctx.session.token_address = tokenName;

      return ctx.reply(ctx.t('text.position_detail', _returnvalue), {
        reply_markup: await sellManageKeyboard(ctx, _returnvalue),
      });
    });
  }
);
