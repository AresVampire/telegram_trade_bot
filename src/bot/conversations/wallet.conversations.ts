import { Chain } from '@prisma/client';
import { QueueEvents } from 'bullmq';
import { InlineKeyboard } from 'grammy';

import { redisConnection } from '~/redis';
import {
  createUserDetailsQueue,
  IUserDetailsWorkerReturnObject,
  USER_DETAILS_QUEUE_NAME,
} from '~/workers';

import { getUserChain } from '../helpers/getUserChain';
import { encrypt, getPrivateKey, selectChain } from '../helpers/utils';
import { welcomeKeyboard } from '../keyboards';
import { Context, Conversation } from '../types';

export async function walletImportKey(
  conversation: Conversation,
  ctx: Context
) {
  await ctx.reply(ctx.t('text.import_key'), {
    reply_markup: new InlineKeyboard().text(ctx.t('label.cancel'), 'btn_back'),
  });

  const {
    message,
    conversation: ctxConversation,
    session,
    local,
    logger,
    prisma,
  } = await conversation.wait();

  const importedPK = message?.text;

  const selectedChain = await selectChain(Number(local.user?.userId));
  const userChain = await getUserChain(Number(ctx.local.user?.userId));

  try {
    if (importedPK === undefined || importedPK.startsWith('/')) {
      throw new Error('NOT_PK');
    }

    const userPK = getPrivateKey(importedPK);
    const wallet = await selectedChain.importWallet(userPK);

    local.user = await prisma.user.update({
      where: { userId: Number(ctx.local.user?.userId) },
      data: {
        chain: Chain.ETHEREUM,
        publicAddress: wallet.address,
        encryptedPrivateKey: encrypt(
          wallet.privateKey,
          ctx.local.user?.userId.toString()
        ),
      },
    });

    const userDetailsQueue = createUserDetailsQueue({
      connection: redisConnection,
    });
    await userDetailsQueue.add(USER_DETAILS_QUEUE_NAME, {
      chain: userChain,
      userId: Number(local.user?.userId || ctx?.from?.id),
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
        ctx.t('text.wallet_imported', {
          address: wallet.address,
          balance,
          nativeCurrency,
        }),
        { reply_markup: await welcomeKeyboard(ctx) }
      );
    });
  } catch (error) {
    logger.error(error);
    await ctx.reply(ctx.t('text.invalid_key'));
    await ctxConversation.enter('walletImportKey');
  }
}
