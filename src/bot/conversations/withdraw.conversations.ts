import { getEthereumAddress } from '@injectivelabs/sdk-ts';
import { QueueEvents } from 'bullmq';
import { isAddress } from 'ethers';
import { InlineKeyboard } from 'grammy';

import { Context, Conversation } from '~/bot/types';
import { redisConnection } from '~/redis';
import { createUserDetailsQueue, USER_DETAILS_QUEUE_NAME } from '~/workers';

import { getUserChain } from '../helpers/getUserChain';
import { selectChain } from '../helpers/utils';
import { transConfirmKeyboard } from '../keyboards';

export async function walletWithdrawAllAmount(
  conversation: Conversation,
  ctx: Context
) {
  try {
    let addressValid = false;
    const selectedChain = await selectChain(Number(ctx.local.user?.userId));
    const userChain = await getUserChain(Number(ctx.local.user?.userId));

    do {
      await ctx.reply(
        ctx.t('text.withdraw_address', {
          nativeCurrency: selectedChain.nativeCurrency(),
        }),
        {
          reply_markup: new InlineKeyboard().text(
            ctx.t('label.cancel'),
            'btn_back'
          ),
        }
      );
      const address = await conversation.form.text();

      const checkValidAddress =
        userChain === 'INJECTIVE'
          ? isAddress(getEthereumAddress(address))
          : isAddress(address);

      if (checkValidAddress) {
        addressValid = true;
        ctx.session.withdraw_address = address;
      } else {
        await ctx.reply(ctx.t('text.invalid_address'), {
          reply_markup: new InlineKeyboard().text(
            ctx.t('label.cancel'),
            'btn_back'
          ),
        });
      }
    } while (!addressValid);

    const userDetailsQueue = createUserDetailsQueue({
      connection: redisConnection,
    });

    const userDetailsJob = await userDetailsQueue.add(
      USER_DETAILS_QUEUE_NAME,
      {
        chain: userChain,
        userId: Number(ctx.local.user?.userId || ctx?.from?.id),
      },
      { removeOnComplete: true, removeOnFail: true }
    );

    const queueEventsUserDetails = new QueueEvents(USER_DETAILS_QUEUE_NAME, {
      connection: redisConnection,
    });
    const userDataResult = await userDetailsJob.waitUntilFinished(
      queueEventsUserDetails
    );

    const gasFee = await selectedChain.getGasPriceProvider(
      ctx.session.withdraw_address as string,
      userDataResult.balance,
      userDataResult.publicAddress
    );
    ctx.session.withdraw_amount = String(
      Number(userDataResult.balance) - Number(gasFee)
    );

    conversation.session = ctx.session;

    await ctx.reply(
      ctx.t('text.confirm_transaction', {
        address: ctx.session.withdraw_address as string,
        amount: String(Number(userDataResult.balance) - Number(gasFee)),
        gas: `${gasFee?.toString()}`,
      }),
      { reply_markup: await transConfirmKeyboard(ctx) }
    );
    return ctx.replyWithChatAction('typing');
  } catch (error) {
    console.log(error, 11111);
  }
}

export async function walletWithdrawAmount(
  conversation: Conversation,
  ctx: Context
) {
  let amountValid = false;
  let addressValid = false;

  const selectedChain = await selectChain(Number(ctx.local.user?.userId));
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

  do {
    await ctx.reply(
      ctx.t('text.withdraw_amount', {
        balance: userDataResult.balance,
        nativeCurrency: selectedChain.nativeCurrency(),
      }),
      {
        reply_markup: new InlineKeyboard().text(
          ctx.t('label.cancel'),
          'btn_back'
        ),
      }
    );
    const amount = await conversation.form.number();

    if (amount <= Number(userDataResult.balance)) {
      amountValid = true;
      ctx.session.withdraw_amount = String(amount);
    } else {
      await ctx.reply(
        ctx.t('text.invalid_amount_too_high', {
          amount,
          balance: userDataResult.balance,
          nativeCurrency: userDataResult.nativeCurrency,
        })
      );
    }
  } while (!amountValid);

  do {
    await ctx.reply(
      ctx.t('text.withdraw_address', {
        nativeCurrency: selectedChain.nativeCurrency(),
      }),
      {
        reply_markup: new InlineKeyboard().text(
          ctx.t('label.cancel'),
          'btn_back'
        ),
      }
    );
    const address = await conversation.form.text();

    const checkValidAddress =
      userChain === 'INJECTIVE'
        ? isAddress(getEthereumAddress(address))
        : isAddress(address);

    if (checkValidAddress) {
      addressValid = true;
      ctx.session.withdraw_address = address;
    } else {
      await ctx.reply(ctx.t('text.invalid_address'), {
        reply_markup: new InlineKeyboard().text(
          ctx.t('label.cancel'),
          'btn_back'
        ),
      });
    }
  } while (!addressValid);

  const gasFee = await selectedChain.getGasPriceProvider(
    ctx.session.withdraw_address as string,
    ctx.session.withdraw_amount as string,
    userDataResult.publicAddress
  );

  // eslint-disable-next-line no-param-reassign
  conversation.session = ctx.session;

  await ctx.reply(
    ctx.t('text.confirm_transaction', {
      address: ctx.session.withdraw_address as string,
      amount: ctx.session.withdraw_amount as string,
      gas: `${gasFee?.toString()}`,
    }),
    { reply_markup: await transConfirmKeyboard(ctx) }
  );
  return ctx.replyWithChatAction('typing');
}

export async function walletWithdrawAddress(
  conversation: Conversation,
  ctx: Context
) {
  const { message, session, local } = await conversation.wait();

  const awaitingAddress = String(message?.text);

  const selectedChain = await selectChain(Number(local.user?.userId));
  const userChain = await getUserChain(Number(ctx.local.user?.userId));

  try {
    if (awaitingAddress === undefined || awaitingAddress.startsWith('/')) {
      throw new Error();
    }

    if (!isAddress(awaitingAddress)) {
      throw new Error();
    }

    session.withdraw_address = awaitingAddress;

    const userDetailsQueue = createUserDetailsQueue({
      connection: redisConnection,
    });

    const userDetailsJob = await userDetailsQueue.add(
      USER_DETAILS_QUEUE_NAME,
      {
        chain: userChain,
        userId: Number(ctx.local.user?.userId || ctx?.from?.id),
      },
      { removeOnComplete: true, removeOnFail: true }
    );

    const queueEventsUserDetails = new QueueEvents(USER_DETAILS_QUEUE_NAME, {
      connection: redisConnection,
    });
    const userDataResult = await userDetailsJob.waitUntilFinished(
      queueEventsUserDetails
    );

    const gasFee = await selectedChain.getGasPriceProvider(
      ctx.session.withdraw_address as string,
      String(session.withdraw_amount),
      userDataResult.publicAddress
    );

    return ctx.reply(
      ctx.t('text.confirm_transaction', {
        address: session.withdraw_address,
        amount: session.withdraw_amount as string,
        gas: gasFee.toString(),
      }),
      { reply_markup: await transConfirmKeyboard(ctx) }
    );
  } catch (error) {
    await ctx.reply(ctx.t('text.invalid_address'), {
      reply_markup: new InlineKeyboard().text(
        ctx.t('label.cancel'),
        'btn_back'
      ),
    });
    return ctx.conversation.enter('walletWithdrawAddress');
  }
}
