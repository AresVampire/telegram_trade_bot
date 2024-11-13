import { Chain } from '@prisma/client';

export interface Wallet {
  createWallet(): any;
  importWallet(privateKey: string): any;
  getBalance(address: string): any;
  getGasPriceProvider(
    toAddress: string,
    amountETH: string,
    fromAddress: string
  ): any;
  withdraw(
    mainWalletPrivateKey: string,
    toAddress: string,
    amountETH: string,
    priority: number
  ): any;
  getTokenName(address: string): any;
  getTokenPrice(address: string): any;
  buyTokens(
    user: string,
    privateKey: string,
    amount: string,
    address: string,
    slippage: string,
    priority: number
  ): any;
  calcGasTokensBuy(
    user: string,
    amount: string,
    address: string,
    slippage: string
  ): any;
  sellTokens(
    user: string,
    privateKey: string,
    amount: string,
    address: string,
    slippage: string,
    priority: number
  ): any;
  calcGasTokenSell(
    user: string,
    amount: string,
    address: string,
    pKey: string,
    slippage: string
  ): any;
  chain(): Chain;
  explorerURL(): string;
  getPosition(user: string, minPosValue: number): any;
  getSellList(user: string, address: string): any;
  estimateBuy(amount: string, token: string): any;
  estimateSell(amount: string, token: string): any;
  nativeCurrency(): string;
  // swap(type: string, tokenAddress: string, amount: number): any;
}
