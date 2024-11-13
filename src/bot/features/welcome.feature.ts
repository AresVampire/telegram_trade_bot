import { QueueEvents } from 'bullmq';
import { Composer, InlineKeyboard } from 'grammy';

import '~/bot/features/positions.feature';
import {
  buyToken,
  createWallet,
  forwardSelectChain,
  home,
  positionsReview,
  sell,
  settings,
  wallet,
} from '~/bot/features/wallet.feature';
import { logHandle } from '~/bot/helpers/logging';
import { Context } from '~/bot/types';
import { redisConnection } from '~/redis';
import {
  createTokenDetailsQueue,
  createUserDetailsQueue,
  TOKEN_DETAILS_QUEUE_NAME,
  USER_DETAILS_QUEUE_NAME,
} from '~/workers';

import { getUserChain } from '../helpers/getUserChain';
import { selectChain } from '../helpers/utils';
import { buyTokenKeyboard } from '../keyboards';

export const composer = new Composer<Context>();
const feature = composer.chatType('private');

feature.command('start', logHandle('command-start'), async (ctx) => {
  const base64String = ctx.match;
  const referralCode = Buffer.from(base64String, 'base64').toString('ascii');
  if (
    referralCode !== '' &&
    !ctx.local.user?.referredBy &&
    referralCode !== ctx.local.user?.referralCode
  ) {
    const user = await ctx.prisma.user.findFirst({
      where: { referralCode },
      select: { userId: true },
    });

    if (user) {
      await ctx.prisma.user.update({
        where: { userId: user.userId },
        data: { referredBy: referralCode },
      });
    }
  }

  if (!ctx.local.user!.chain) {
    return forwardSelectChain(ctx);
  }

  if (!ctx.local.user?.publicAddress) {
    return createWallet(ctx);
  }

  const selectedChain = await selectChain(Number(ctx.local.user?.userId));

  const positions = await selectedChain.getPosition(
    String(ctx.local.user?.publicAddress).toLowerCase(),
    ctx.session.settings.pos_value
  );

  if (!positions?.length) {
    return home(ctx);
  }

  return positionsReview(ctx, positions);
});

feature.command('chain', logHandle('switch-chain'), async (ctx) =>
  forwardSelectChain(ctx)
);

feature.command('buy', logHandle('command-buy'), async (ctx) => {
  if (!ctx.local.user!.chain) await forwardSelectChain(ctx);
  else if (!ctx.local.user?.publicAddress) {
    await createWallet(ctx);
  } else {
    await buyToken(ctx);
  }
});

feature.command('wallet', logHandle('command-wallet'), async (ctx) => {
  if (!ctx.local.user!.chain) await forwardSelectChain(ctx);
  else if (!ctx.local.user?.publicAddress) {
    await createWallet(ctx);
  } else {
    await wallet(ctx);
  }
});

feature.command('settings', logHandle('command-settings'), async (ctx) => {
  if (!ctx.local.user!.chain) return forwardSelectChain(ctx);

  if (!ctx.local.user?.publicAddress) {
    return createWallet(ctx);
  }
  return settings(ctx);
});

feature.command('positions', logHandle('command-positions'), async (ctx) => {
  if (!ctx.local.user!.chain) await forwardSelectChain(ctx);
  else if (!ctx.local.user?.publicAddress) {
    await createWallet(ctx);
  } else {
    await ctx.replyWithChatAction('typing');
    await sell(ctx);
  }
});

feature.hears(/0x[a-fA-F0-9]{40}/, async (ctx) => {
  if (!ctx.local.user!.chain) {
    await forwardSelectChain(ctx);
  } else {
    const contractAddress = ctx.message.text as string;
    try {
      const userChain = await getUserChain(Number(ctx.local.user?.userId));
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
      ctx.session.token_address = contractAddress;
      ctx.session.token_name = tokenName;

      await ctx.reply(
        ctx.t('text.contract_detail', {
          tokenName,
          contractAddress,
          tokenPrice,
          marketCap: mcap,
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
});
