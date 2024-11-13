import { QueueEvents } from 'bullmq';
import { formatUnits } from 'ethers';
import { InlineKeyboard } from 'grammy';

import { Context, Conversation } from '~/bot/types';
import { redisConnection } from '~/redis';
import { createSellTokenGasQueue, SELL_TOKEN_GAS_QUEUE_NAME } from '~/workers';

import { getUserChain } from '../helpers/getUserChain';
import { decrypt, isNumeric, selectChain } from '../helpers/utils';
import { sellTokenConfirmKeyboard, settingsKeyboard } from '../keyboards';

export async function setPositionSellTokenValueAmount(
  conversation: Conversation,
  ctx: Context
) {
  const {
    message,
    session,
    conversation: ctxConversation,
    local,
    logger,
  } = await conversation.wait();

  const value = String(message?.text);

  try {
    if (value === undefined || value.startsWith('/')) {
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

    if (
      !isNumeric(value) ||
      Number(value) > Number(formatUnits(tokenBalance, tokenDecimals))
    ) {
      throw new Error();
    }

    session.token_amount = value;

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
    const tokenSellJob = await sellTokenGasQueue.add(
      SELL_TOKEN_GAS_QUEUE_NAME,
      {
        chain: userChain,
        sellSlippage: String(session.settings.slippage_sell),
        userPKey: decrypt(
          local?.user?.encryptedPrivateKey!,
          ctx.from?.id
        ).toString(),
        userPublicAddress: String(local.user?.publicAddress),
        tokenAmount: String(session.token_amount),
        tokenAddress: String(session.token_address),
      }
    );

    const queueEvents = new QueueEvents(SELL_TOKEN_GAS_QUEUE_NAME, {
      connection: redisConnection,
    });

    const tokenSellData = await tokenSellJob.waitUntilFinished(queueEvents);

    if (!tokenSellData.success) {
      throw new Error();
    }

    return ctx.reply(
      ctx.t('text.confirm_sell_transaction', {
        address: ctx.session.token_address as string,
        amount: session.token_amount,
        sellTokenCurrency,
        currency: selectedChain.nativeCurrency(),
        currencyamt: Number(session.token_amount) * Number(tokenPrice),
        gas: tokenSellData.gas,
      }),
      { reply_markup: await sellTokenConfirmKeyboard(ctx) }
    );
  } catch (error) {
    logger.error(error);
    await ctx.reply(ctx.t('text.invalid_amount'), {
      reply_markup: new InlineKeyboard().text(
        ctx.t('label.cancel'),
        'btn_back'
      ),
    });
    return ctxConversation.enter('setPositionSellTokenValueAmount');
  }
}

export async function setBuyLeftValue(
  conversation: Conversation,
  ctx: Context
) {
  let isValueValid = false;
  const selectedChain = await selectChain(Number(ctx.local.user?.userId));

  do {
    const value = await conversation.form.text();
    if (value === undefined || value.startsWith('/')) {
      await ctx.reply(ctx.t('text.invalid_amount'), {
        reply_markup: new InlineKeyboard().text(
          ctx.t('label.cancel'),
          'btn_back'
        ),
      });
      continue;
    }

    if (!isNumeric(value)) {
      await ctx.reply(ctx.t('text.invalid_amount'), {
        reply_markup: new InlineKeyboard().text(
          ctx.t('label.cancel'),
          'btn_back'
        ),
      });
      continue;
    }

    ctx.session.settings.buy_left = parseFloat(value);
    isValueValid = true;
  } while (!isValueValid);

  conversation.session = ctx.session;

  await ctx.editMessageText(ctx.t('text.settings_desc'), {
    reply_markup: await settingsKeyboard(ctx),
  });

  return ctx.reply(
    ctx.t('text.reply_btn_buy_left_value_set', {
      value: ctx.session.settings.buy_left,
      nativeCurrency: selectedChain.nativeCurrency(),
    })
  );
}

export async function setBuySlippageValue(
  conversation: Conversation,
  ctx: Context
) {
  let isValueValid = false;

  do {
    const value = await conversation.form.text();

    if (value === undefined || value.startsWith('/')) {
      await ctx.reply(ctx.t('text.invalid_amount'), {
        reply_markup: new InlineKeyboard().text(
          ctx.t('label.cancel'),
          'btn_back'
        ),
      });
      continue;
    }

    if (!isNumeric(value) || Number(value) > 100 || Number(value) < 0) {
      await ctx.reply(ctx.t('text.invalid_amount'), {
        reply_markup: new InlineKeyboard().text(
          ctx.t('label.cancel'),
          'btn_back'
        ),
      });
      continue;
    }

    isValueValid = true;
    ctx.session.settings.slippage_buy = Number(value);
  } while (!isValueValid);

  conversation.session = ctx.session;

  await ctx.editMessageText(ctx.t('text.settings_desc'), {
    reply_markup: await settingsKeyboard(ctx),
  });

  return ctx.reply(
    ctx.t('text.reply_btn_slippage_buy_set', {
      value: ctx.session.settings.slippage_buy,
    })
  );
}

export async function setSellSlippageValue(
  conversation: Conversation,
  ctx: Context
) {
  let isValueValid = false;

  do {
    const value = await conversation.form.text();

    if (value === undefined || value.startsWith('/')) {
      await ctx.reply(ctx.t('text.invalid_amount'), {
        reply_markup: new InlineKeyboard().text(
          ctx.t('label.cancel'),
          'btn_back'
        ),
      });
      continue;
    }

    if (!isNumeric(value) || Number(value) > 100 || Number(value) < 0) {
      await ctx.reply(ctx.t('text.invalid_amount'), {
        reply_markup: new InlineKeyboard().text(
          ctx.t('label.cancel'),
          'btn_back'
        ),
      });
      continue;
    }

    isValueValid = true;
    ctx.session.settings.slippage_sell = Number(value);
  } while (!isValueValid);

  conversation.session = ctx.session;

  await ctx.editMessageText(ctx.t('text.settings_desc'), {
    reply_markup: await settingsKeyboard(ctx),
  });

  return ctx.reply(
    ctx.t('text.reply_btn_slippage_sell_set', {
      value: ctx.session.settings.slippage_sell,
    })
  );
}

export async function setBuyRightValue(
  conversation: Conversation,
  ctx: Context
) {
  let isValueValid = false;

  const selectedChain = await selectChain(Number(ctx.local.user?.userId));

  do {
    const value = await conversation.form.text();
    if (value === undefined || value.startsWith('/')) {
      await ctx.reply(ctx.t('text.invalid_amount'), {
        reply_markup: new InlineKeyboard().text(
          ctx.t('label.cancel'),
          'btn_back'
        ),
      });
      continue;
    }

    if (!isNumeric(value)) {
      await ctx.reply(ctx.t('text.invalid_amount'), {
        reply_markup: new InlineKeyboard().text(
          ctx.t('label.cancel'),
          'btn_back'
        ),
      });
      continue;
    }

    ctx.session.settings.buy_right = parseFloat(value);
    isValueValid = true;
  } while (!isValueValid);

  conversation.session = ctx.session;

  await ctx.editMessageText(ctx.t('text.settings_desc'), {
    reply_markup: await settingsKeyboard(ctx),
  });

  await ctx.reply(
    ctx.t('text.reply_btn_buy_right_value_set', {
      value: ctx.session.settings.buy_right,
      nativeCurrency: selectedChain.nativeCurrency(),
    })
  );
}

export async function setSellLeftValue(
  conversation: Conversation,
  ctx: Context
) {
  let isValueValid = false;

  do {
    const value = await conversation.form.text();

    if (value === undefined || value.startsWith('/')) {
      await ctx.reply(ctx.t('text.invalid_amount'), {
        reply_markup: new InlineKeyboard().text(
          ctx.t('label.cancel'),
          'btn_back'
        ),
      });
      continue;
    }

    if (!isNumeric(value) || Number(value) > 100) {
      await ctx.reply(ctx.t('text.invalid_amount'), {
        reply_markup: new InlineKeyboard().text(
          ctx.t('label.cancel'),
          'btn_back'
        ),
      });
      continue;
    }

    ctx.session.settings.sell_left = Number(value);
    isValueValid = true;
  } while (!isValueValid);

  conversation.session = ctx.session;

  await ctx.editMessageText(ctx.t('text.settings_desc'), {
    reply_markup: await settingsKeyboard(ctx),
  });

  return ctx.reply(
    ctx.t('text.reply_btn_sell_left_value_set', {
      value: ctx.session.settings.sell_left,
    })
  );
}

export async function setSellRightValue(
  conversation: Conversation,
  ctx: Context
) {
  let isValueValid = false;

  do {
    const value = await conversation.form.text();

    if (value === undefined || value.startsWith('/')) {
      await ctx.reply(ctx.t('text.invalid_amount'), {
        reply_markup: new InlineKeyboard().text(
          ctx.t('label.cancel'),
          'btn_back'
        ),
      });
      continue;
    }

    if (!isNumeric(value) || Number(value) > 100) {
      await ctx.reply(ctx.t('text.invalid_amount'), {
        reply_markup: new InlineKeyboard().text(
          ctx.t('label.cancel'),
          'btn_back'
        ),
      });
      continue;
    }

    ctx.session.settings.sell_right = Number(value);
    isValueValid = true;
  } while (!isValueValid);

  conversation.session = ctx.session;

  await ctx.editMessageText(ctx.t('text.settings_desc'), {
    reply_markup: await settingsKeyboard(ctx),
  });

  return ctx.reply(
    ctx.t('text.reply_btn_sell_right_value_set', {
      value: ctx.session.settings.sell_right,
    })
  );
}

export async function setPosValue(conversation: Conversation, ctx: Context) {
  let isValueValid = false;

  const selectedChain = await selectChain(Number(ctx.local.user?.userId));

  do {
    const value = await conversation.form.text();

    if (value === undefined || value.startsWith('/')) {
      await ctx.reply(ctx.t('text.invalid_amount'), {
        reply_markup: new InlineKeyboard().text(
          ctx.t('label.cancel'),
          'btn_back'
        ),
      });
      continue;
    }

    if (!isNumeric(value)) {
      await ctx.reply(ctx.t('text.invalid_amount'), {
        reply_markup: new InlineKeyboard().text(
          ctx.t('label.cancel'),
          'btn_back'
        ),
      });
      continue;
    }

    ctx.session.settings.pos_value = parseFloat(value);
    isValueValid = true;
  } while (!isValueValid);

  conversation.session = ctx.session;

  await ctx.editMessageText(ctx.t('text.settings_desc'), {
    reply_markup: await settingsKeyboard(ctx),
  });

  return ctx.reply(
    ctx.t('text.set_pos_value', {
      value: String(ctx.session.settings.pos_value),
      nativeCurrency: selectedChain.nativeCurrency(),
    })
  );
}

export async function setBuyTokenAmount(
  conversation: Conversation,
  ctx: Context
) {
  let isValueValid = false;

  const selectedChain = await selectChain(Number(ctx.local.user?.userId));

  do {
    const value = await conversation.form.text();

    if (value === undefined || value.startsWith('/')) {
      await ctx.reply(ctx.t('text.invalid_amount'), {
        reply_markup: new InlineKeyboard().text(
          ctx.t('label.cancel'),
          'btn_back'
        ),
      });
      continue;
    }

    if (!isNumeric(value) || Number(value) < 0) {
      await ctx.reply(ctx.t('text.invalid_amount'), {
        reply_markup: new InlineKeyboard().text(
          ctx.t('label.cancel'),
          'btn_back'
        ),
      });
      continue;
    }

    ctx.session.settings.auto_value = Number(value);
    isValueValid = true;
  } while (!isValueValid);

  conversation.session = ctx.session;

  await ctx.editMessageText(ctx.t('text.settings_desc'), {
    reply_markup: await settingsKeyboard(ctx),
  });

  return ctx.reply(
    ctx.t('text.set_auto_amount', {
      amount: ctx.session.settings.auto_value,
      nativeCurrency: selectedChain.nativeCurrency(),
    })
  );
}

export async function setPriorityAmount(
  conversation: Conversation,
  ctx: Context
) {
  let isValueValid = false;

  const selectedChain = await selectChain(Number(ctx.local.user?.userId));

  do {
    const value = await conversation.form.text();

    if (value === undefined || value.startsWith('/')) {
      await ctx.reply(ctx.t('text.invalid_amount'), {
        reply_markup: new InlineKeyboard().text(
          ctx.t('label.cancel'),
          'btn_back'
        ),
      });
      continue;
    }

    if (!isNumeric(value) || Number(value) === 0) {
      await ctx.reply(ctx.t('text.invalid_amount'), {
        reply_markup: new InlineKeyboard().text(
          ctx.t('label.cancel'),
          'btn_back'
        ),
      });
      continue;
    }

    ctx.session.settings.trans_value = parseFloat(value);
    isValueValid = true;
  } while (!isValueValid);

  conversation.session = ctx.session;

  await ctx.editMessageText(ctx.t('text.settings_desc'), {
    reply_markup: await settingsKeyboard(ctx),
  });

  return ctx.reply(
    ctx.t('text.set_priority_amount', {
      amount: ctx.session.settings.trans_value,
      nativeCurrency: selectedChain.nativeCurrency(),
    })
  );
}
