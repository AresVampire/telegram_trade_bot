import { Chain } from '@prisma/client';
import { ethers } from 'ethers';
import crypto from 'node:crypto';
import { isAddress } from 'viem';

import { EthereumWallet } from '~/bot/helpers/wallet/ethereum';
import { Context, SessionData } from '~/bot/types';
import { config } from '~/config';

import { getUserChain } from './getUserChain';
import { InjectiveWallet } from './wallet';
import { BinanceWallet } from './wallet/binance';

const generateRandomString = (length: number) => {
  const characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let randomString = '';

  // eslint-disable-next-line no-plusplus
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    randomString += characters.charAt(randomIndex);
  }

  return randomString;
};

export const sessionKey = (userId: bigint | number | string) =>
  `session:${userId.toString()}`;

export const generateReferralCode = () => {
  const randomString = generateRandomString(6); // Specify the desired length of the random string
  const timestamp = Date.now().toString();
  const hash = crypto
    .createHash('sha256')
    .update(randomString + timestamp)
    .digest('hex');
  const referralCode = hash.substring(0, 10); // Specify the desired length of the referral code

  return referralCode;
};

export const encrypt = (
  data: string,
  userPresharedKey: string | number | undefined
) => {
  const salt = crypto.randomBytes(64);
  const iv = crypto.randomBytes(16);

  const key = crypto.pbkdf2Sync(
    `${config.BOT_ENCRYPTION_PSK},${userPresharedKey}`,
    salt,
    10_000,
    32,
    'sha512'
  );

  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
  const tag = cipher.getAuthTag();

  return Buffer.concat([salt, iv, tag, encrypted]);
};

export const decrypt = (
  data: Buffer,
  userPresharedKey: string | number | undefined
) => {
  const salt = data.subarray(0, 64);
  const iv = data.subarray(64, 80);
  const tag = data.subarray(80, 96);

  const key = crypto.pbkdf2Sync(
    `${config.BOT_ENCRYPTION_PSK},${userPresharedKey}`,
    salt,
    10_000,
    32,
    'sha512'
  );

  const cipher = crypto
    .createDecipheriv('aes-256-gcm', key, iv)
    .setAuthTag(tag);

  const decrypted = Buffer.concat([
    cipher.update(data.subarray(96)),
    cipher.final(),
  ]);

  return decrypted;
};

export const isNumeric = (val: string): boolean => {
  if (isAddress(val)) {
    return false;
  }
  const onlyDigit = /^\d+\.\d+$|^\d+$/.test(val);
  return onlyDigit;
};

export const ValidateWalletPublicKey = (address: string) => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

export const getPrivateKey = (key: string): string => {
  let privateKey = key;
  try {
    const byteArray = JSON.parse(privateKey);
    const buffer = Buffer.from(byteArray);
    privateKey = ethers.hexlify(buffer);
  } catch (error) {
    if (privateKey.indexOf('0x') < 0) {
      privateKey = `0x${privateKey}`;
    }
  }

  return privateKey;
};

export const selectChain = async (userId: number) => {
  const userChain = await getUserChain(userId);

  switch (userChain) {
    case Chain.ETHEREUM:
      return new EthereumWallet();

    case Chain.BINANCE:
      return new BinanceWallet();

    case Chain.INJECTIVE:
      return new InjectiveWallet();

    default:
      throw new Error(`Chain '${userChain}' not supported`);
  }
};

export const selectChainFromCtx = (chain: Chain | string) => {
  switch (chain) {
    case Chain.ETHEREUM:
      return new EthereumWallet();

    case Chain.BINANCE:
      return new BinanceWallet();

    case Chain.INJECTIVE:
      return new InjectiveWallet();

    default:
      throw new Error(`Chain '${chain}' not supported`);
  }
};

export const saveSettings = async (
  ctx: Context,
  userId: bigint | undefined,
  session: SessionData
) => {
  if (userId) {
    await ctx.prisma.user.update({
      where: { userId: Number(userId) },
      data: { settings: session.settings },
    });
  }
};

export const getExplorerLink = (chain: Chain | string, hash: string) => {
  switch (chain as Chain) {
    case Chain.ETHEREUM:
      return `${selectChainFromCtx(chain).explorerURL()}tx/${hash}`;

    case Chain.BINANCE:
      return `${selectChainFromCtx(chain).explorerURL()}tx/${hash}`;

    case Chain.INJECTIVE:
      return `${selectChainFromCtx(chain).explorerURL()}transaction/${hash}`;

    default:
      throw new Error(`Chain '${chain}' not supported`);
  }
};
