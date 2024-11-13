import { User } from '@prisma/client';

import { Wallet } from '~/bot/types/wallet';

export interface SessionData {
  // conversation: object
  user: User;
  chain: string;
  balance: number;
  wallet?: Wallet;
  languageCode?: string;
  withdraw_amount?: string;
  withdraw_address?: string;
  token_address?: string;
  token_amount?: string;
  token_price?: string;
  token_name?: string;
  type?: string;
  private_key?: string;
  settings: {
    announce_status: number;
    pos_value: number;
    auto_status: number;
    auto_value: number;
    trans_level: number;
    trans_value: number;
    buy_left: number;
    buy_right: number;
    sell_left: number;
    sell_right: number;
    slippage_buy: number;
    slippage_sell: number;
  };
}
