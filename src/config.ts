import 'dotenv/config';
import { cleanEnv, json, num, str } from 'envalid';

export const config = cleanEnv(process.env, {
  NODE_ENV: str({
    choices: ['development', 'production', 'test'],
  }),
  LOG_LEVEL: str({
    choices: ['trace', 'debug', 'info', 'warn', 'error', 'fatal', 'silent'],
  }),
  DATABASE_URL: str(),
  REDIS_URL: str(),

  BIND: str({ default: '0.0.0.0' }),
  PORT: num({ default: 80 }),

  BOT_ALLOWED_UPDATES: json({ default: [] }),

  BOT_TOKEN: str(),
  BOT_MODE: str({ choices: ['longpoll', 'webhook'], default: 'longpoll' }),
  BOT_WEBHOOK: str(),
  BOT_ENCRYPTION_PSK: str(),

  ETHEREUM_NODE_URL: str({
    default:
      'https://eth-sepolia.g.alchemy.com/v2/Fskn8WtfxT0nTew2XuvRzZaQn5R84XaF',
  }),
  ETHEREUM_PROXY_ADDRESS: str(),
  ETHEREUM_SWAP_ADDRESS: str(),
  ETHEREUM_WRAPPED_TOKEN: str(),

  BINANCE_NODE_URL: str({ default: 'https://bsc-testnet.drpc.org' }),
  BINANCE_PROXY_ADDRESS: str(),
  BINANCE_SWAP_ADDRESS: str(),
  BINANCE_WRAPPED_TOKEN: str(),
});

export type Config = typeof config;
