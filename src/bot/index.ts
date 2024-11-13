import { conversations, createConversation } from '@grammyjs/conversations';
import { hydrate } from '@grammyjs/hydrate';
import { hydrateReply, parseMode } from '@grammyjs/parse-mode';
import { limit as rateLimit } from '@grammyjs/ratelimiter';
import { apiThrottler } from '@grammyjs/transformer-throttler';
import { BotConfig, Bot as GrammyBot, StorageAdapter } from 'grammy';

import { createContextConstructor } from '~/bot/context';
import {
  contractAutoBuyTokenAmount,
  contractBuyTokenAmount,
  contractSellTokenAmount,
  setBuyContractAddress,
  setBuyLeftValue,
  setBuyRightValue,
  setBuySlippageValue,
  setBuyTokenAmount,
  setPositionSellTokenValue,
  setPositionSellTokenValueAmount,
  setPosValue,
  setPriorityAmount,
  setSellContractAddress,
  setSellLeftValue,
  setSellRightValue,
  setSellSlippageValue,
  walletImportKey,
  walletWithdrawAddress,
  walletWithdrawAllAmount,
  walletWithdrawAmount,
} from '~/bot/conversations';
import {
  commonFeature,
  positionsFeature,
  settingsFeature,
  tradingFeature,
  walletFeature,
  welcomeFeature,
} from '~/bot/features';
import { handleError } from '~/bot/helpers/error-handler';
import {
  setupI18n,
  setupLocalContext,
  setupLogger,
  setupSession,
  setUser,
  updatesLogger,
} from '~/bot/middlewares';
import { Context } from '~/bot/types';
import { config } from '~/config';
import { Container } from '~/container';

interface Dependencies {
  container: Container;
  sessionStorage: StorageAdapter<unknown>;
}

export function createBot(
  token: string,
  { container, sessionStorage }: Dependencies,
  botConfig?: Omit<BotConfig<Context>, 'ContextConstructor'>
) {
  const bot = new GrammyBot(token, {
    ...botConfig,
    ContextConstructor: createContextConstructor(container),
  });

  const protectedBot = bot.errorBoundary(handleError);

  bot.api.config.use(apiThrottler());
  bot.api.config.use(parseMode('HTML'));
  // bot.api.setMyName('SnaipBot')
  bot.api
    .setMyDescription(
      `
    <img src="image/logo.png" width="200" height="200">
    <b>What can this bot do?</b>
    Kira Trading Bot on Injective is the
    fastest and most advanced on-chain bot,
    designed to give YOU full control of your
    trades.

    <b>Want to learn more about us?</b>
    Website: kira.cat
    X: x.com/kiraoninjective

    Bot Commands:
    /start
    /chain
    /buy
    /wallet
    /positions
    /settings
  `
      //       `
      //   Trade effortlessly, from anywhere. \nExperience seamless, lightning-fast trading.\n\nTap /Start to open main menu and start using all our features. \n\nWebsite: degendevs.com
      // \nTwitter/X: @DevsDegen
      //   `
    )
    .catch(container.logger.error);

  if (config.isDev) {
    protectedBot.use(updatesLogger());
  }

  protectedBot
    .use(hydrateReply)
    .use(hydrate())
    .use(rateLimit())
    .use(setupSession())
    .use(setupLocalContext())
    .use(setupLogger())
    .use(setupI18n())
    .use(setUser())
    .use(conversations());

  protectedBot.use(commonFeature);

  protectedBot
    .use(createConversation(walletImportKey, 'walletImportKey'))
    .use(createConversation(walletWithdrawAllAmount, 'walletWithdrawAllAmount'))
    .use(createConversation(walletWithdrawAmount, 'walletWithdrawAmount'))
    .use(createConversation(walletWithdrawAddress, 'walletWithdrawAddress'))
    .use(walletFeature);

  protectedBot
    .use(
      createConversation(
        contractAutoBuyTokenAmount,
        'contractAutoBuyTokenAmount'
      )
    )
    .use(createConversation(setBuyTokenAmount, 'setBuyTokenAmount'))
    .use(createConversation(setPriorityAmount, 'setPriorityAmount'))
    .use(createConversation(setPosValue, 'setPosValue'))
    .use(createConversation(setBuyLeftValue, 'setBuyLeftValue'))
    .use(createConversation(setBuyRightValue, 'setBuyRightValue'))
    .use(createConversation(setSellLeftValue, 'setSellLeftValue'))
    .use(createConversation(setSellRightValue, 'setSellRightValue'))
    .use(createConversation(setBuySlippageValue, 'setBuySlippageValue'))
    .use(createConversation(setSellSlippageValue, 'setSellSlippageValue'))
    .use(settingsFeature);

  protectedBot
    .use(
      createConversation(setPositionSellTokenValue, 'setPositionSellTokenValue')
    )
    .use(
      createConversation(
        setPositionSellTokenValueAmount,
        'setPositionSellTokenValueAmount'
      )
    )
    .use(createConversation(contractBuyTokenAmount, 'contractBuyTokenAmount'))
    .use(createConversation(contractSellTokenAmount, 'contractSellTokenAmount'))
    .use(createConversation(setBuyContractAddress, 'setBuyContractAddress'))
    .use(createConversation(setSellContractAddress, 'setSellContractAddress'))
    .use(tradingFeature)
    .use(positionsFeature);

  protectedBot.use(welcomeFeature);

  bot.api
    .setMyCommands([
      { command: 'start', description: 'Select chain and open main menu' },
      { command: 'chain', description: 'Switch chain' },
      { command: 'buy', description: 'Buy token' },
      { command: 'wallet', description: 'Manage wallet' },
      { command: 'positions', description: 'Manage your positions' },
      { command: 'settings', description: 'Customize the bot' },
    ])
    .catch(container.logger.error);

  return bot;
}

export type Bot = ReturnType<typeof createBot>;
