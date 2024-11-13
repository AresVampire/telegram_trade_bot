import { getNetworkEndpoints } from '@injectivelabs/networks';
import {
  ChainGrpcBankApi,
  ChainGrpcWasmApi,
  ChainRestAuthApi,
  getGasPriceBasedOnMessage,
  getInjectiveAddress,
  IndexerGrpcDerivativesApi,
  IndexerGrpcOracleApi,
  MsgBroadcasterWithPk,
  Msgs,
  MsgSend,
  PrivateKey,
} from '@injectivelabs/sdk-ts';
import {
  DenomClientAsync,
  InjNameService,
  TokenPrice,
} from '@injectivelabs/sdk-ui-ts';
import {
  BigNumber,
  BigNumberInBase,
  BigNumberInWei,
  DEFAULT_GAS_PRICE,
} from '@injectivelabs/utils';
import { Chain } from '@prisma/client';
import {
  ethers,
  Wallet as EthersWallet,
  formatEther,
  formatUnits,
  parseUnits,
  Provider,
} from 'ethers';

import { Position, Wallet } from '~/bot/types';
import { config } from '~/config';
import { NETWORK } from '~/constants/injective';
import { calculatePNL, getPositions } from '~/services/transaction.service';

import {
  estimateBuy,
  estimateSell,
  getBuySwapMsg,
  getSellSwapMsg,
} from '../injectiveSwap/mitoswap';
import { swapContractAddr, swapProtocolAddr, wethAddr } from './helper';

export class InjectiveWallet implements Wallet {
  ethersProvider: Provider;

  endpoints = getNetworkEndpoints(NETWORK);

  chainBankApiGrpc = new ChainGrpcBankApi(this.endpoints.grpc);
  chainRestAuthApi = new ChainRestAuthApi(this.endpoints.rest);
  chainGrpcWasmApi = new ChainGrpcWasmApi(this.endpoints.grpc);
  denomClient = new DenomClientAsync(NETWORK, {});
  nameService = new InjNameService(NETWORK);
  tokenPrice = new TokenPrice(NETWORK);

  constructor() {
    this.ethersProvider = new ethers.JsonRpcProvider(config.ETHEREUM_NODE_URL);
  }

  chain = () => Chain.INJECTIVE;

  explorerURL = () => 'https://explorer.injective.network/';

  nativeCurrency = () => 'INJ';

  async createWallet() {
    const ethereumWallet = EthersWallet.createRandom();
    const privateKeyFromHex = PrivateKey.fromHex(ethereumWallet.privateKey);

    return {
      address: privateKeyFromHex.toBech32(),
      privateKey: ethereumWallet.privateKey,
    };
  }

  importWallet(privateKey: string) {
    const privateKeyFromHex = PrivateKey.fromHex(privateKey);

    return {
      address: privateKeyFromHex.toBech32(),
      privateKey: privateKey,
    };
  }

  async getBalance(address: string) {
    try {
      const balance = await this.chainBankApiGrpc.fetchBalance({
        accountAddress: address,
        denom: 'inj',
      });
      return new BigNumberInWei(balance.amount).toBase().toString();
    } catch (error) {
      return '0';
    }
  }

  getFeeMessages({ user, amount }: { user: string; amount: string }): Msgs[] {
    const feeAmount = new BigNumberInBase(amount)
      .times(new BigNumber(0.05))
      .plus(DEFAULT_GAS_PRICE)
      .toString();
    return [
      MsgSend.fromJSON({
        srcInjectiveAddress: user,
        // TODO: replace with correct fee wallet
        dstInjectiveAddress: 'inj153aamk0zm4hfmv66pzgf629a9mjs2fyjr46y6q',
        amount: {
          amount: feeAmount,
          denom: 'inj',
        },
      }),
    ];
  }

  async getGasPriceProvider(
    dstInjectiveAddress: string,
    amount: string,
    srcInjectiveAddress: string
  ) {
    const withdrawMsg = MsgSend.fromJSON({
      dstInjectiveAddress,
      srcInjectiveAddress,
      amount: {
        amount: new BigNumberInBase(amount)
          .plus(DEFAULT_GAS_PRICE)
          .toWei()
          .toString(),
        denom: 'inj',
      },
    });
    const gasPrice = getGasPriceBasedOnMessage([withdrawMsg]);
    return formatEther(gasPrice).toString();
  }

  async broadcastMessage(
    msgs: Msgs | Msgs[],
    privateKey: string
  ): Promise<string> {
    let txResponse;
    try {
      txResponse = await new MsgBroadcasterWithPk({
        privateKey,
        network: NETWORK,
        simulateTx: true,
      }).broadcast({ msgs });
    } catch (e: any) {
      throw new Error(
        `Transaction simulation failed: ${e.originalMessage ?? e.message ?? e}`
      );
    }
    if (txResponse.code !== 0) {
      throw new Error(`Transaction failed: ${txResponse.rawLog}`);
    }

    return txResponse.txHash;
  }

  async withdraw(
    mainWalletPrivateKey: string,
    toAddress: string,
    amountETH: string,
    priority: number
  ) {
    const wallet = new ethers.Wallet(mainWalletPrivateKey, this.ethersProvider);

    const withdrawMsg = MsgSend.fromJSON({
      dstInjectiveAddress: toAddress,
      srcInjectiveAddress: getInjectiveAddress(wallet.address),
      amount: {
        amount: new BigNumberInBase(amountETH).toWei().toString(),
        denom: 'inj',
      },
    });

    return this.broadcastMessage(withdrawMsg, mainWalletPrivateKey);
  }

  async getDecimals(address: string) {
    try {
      const token = await this.denomClient.getDenomToken(address);

      if (!token) {
        return 'error';
      }

      return token.decimals;
    } catch (error) {
      return 'error';
    }
  }

  async getTokenSymbol(address: string) {
    try {
      const token = await this.denomClient.getDenomToken(address);

      if (!token) {
        return 'error';
      }

      return token.symbol;
    } catch (error) {
      return 'error';
    }
  }

  async getTokenName(address: string) {
    try {
      const token = await this.denomClient.getDenomToken(address);

      if (!token) {
        return 'error';
      }

      return token.name;
    } catch (error) {
      console.log(error);

      return 'error';
    }
  }

  async getTokenPrice(address: string) {
    try {
      const token = await this.denomClient.getDenomToken(address);

      if (!token) {
        return 'error';
      }
      // const price = await this.tokenPrice.fetchUsdTokenPrice(token.coinGeckoId)

      const marketApi = new IndexerGrpcDerivativesApi(this.endpoints.indexer);
      const indexerGrpcOracleApi = new IndexerGrpcOracleApi(
        this.endpoints.indexer
      );

      const markets = await marketApi.fetchMarkets();
      const market = markets.find(
        (market) => market.ticker === `INJ/${token.symbol} PERP`
      );

      if (!market) {
        const res: Record<string, any> = await fetch(
          'https://k8s.mainnet.asset.injective.network/asset-price/v1/denoms?withPrice=true'
        ).then((res) => res.json() as Record<string, any>);
        if (!res[address]) {
          throw new Error();
        }
        const price = res[address]?.price?.price;

        return `${price}`;
      }

      // @ts-ignore
      const baseSymbol = market.oracleBase;
      // @ts-ignore
      const quoteSymbol = market.oracleQuote;
      const oracleType = market.oracleType;

      const oraclePrice = await indexerGrpcOracleApi.fetchOraclePriceNoThrow({
        baseSymbol,
        quoteSymbol,
        oracleType,
      });

      return `${oraclePrice.price}`;
    } catch (error) {
      return 'error';
    }
  }

  async getTokenPriceMap(addresses: string[]): Promise<Map<string, number>> {
    return new Map<string, number>(
      await Promise.all(
        Array.from(new Set(addresses)).map(async (address) => {
          return [address, Number(await this.getTokenPrice(address))] as [
            string,
            number,
          ];
        })
      )
    );
  }

  async buyTokens(
    user: string,
    privateKey: string,
    amount: string,
    address: string,
    slippage: string,
    priority: number
  ) {
    try {
      // @ts-ignore
      // const { route, rawAmountIn, rawAmountOut } = await this.estimateBuy(
      //   amount,
      //   address
      // )
      // if (!route)
      //   throw new Error(`could not find route to swap ${amount} ${address}`)

      // const { coins, contract, execute_msg } = route
      // if (execute_msg.execute_swap_operations)
      //   execute_msg.execute_swap_operations.minimum_receive ||=
      //     rawAmountOut.toString()
      // const message = MsgExecuteContractCompat.fromJSON({
      //   contractAddress: contract,
      //   sender: user,
      //   funds: [
      //     {
      //       denom: 'inj',
      //       amount: rawAmountIn.toString(),
      //     },
      //   ],
      //   msg: execute_msg,
      // })

      // const msgBroadcaster = new MsgBroadcasterWithPk({
      //   privateKey: privateKey,
      //   network: NETWORK,
      // })
      // try {
      //   await msgBroadcaster.simulate({ msgs: message })
      // } catch (e) {
      //   throw new Error(
      //     `Transaction simulation failed: ${(e as Error).message ?? e}`
      //   )
      // }

      // const txResponse = await msgBroadcaster.broadcast({ msgs: message })
      // if (txResponse.code !== 0) {
      //   throw new Error(`Transaction failed: ${txResponse.rawLog}`)
      // } else {
      //   return txResponse.txHash
      // }
      // const feeMsgs = await this.getFeeMessages({
      //   user,
      //   amount,
      // })

      const { rawAmountIn } = await this.estimateBuy(amount, address);
      const swapMsg = await getBuySwapMsg(
        this.chainGrpcWasmApi,
        user,
        rawAmountIn.toString(),
        address
      );
      const feeMsgs = this.getFeeMessages({
        user,
        amount: rawAmountIn.toString(),
      });
      return this.broadcastMessage([swapMsg, ...feeMsgs], privateKey);
    } catch (error) {
      console.error({
        message: 'buyTokens failed',
        err: error,
      });
      return 'error';
    }
  }

  async calcGasTokensBuy(
    user: string,
    amount: string,
    address: string,
    slippage: string
  ) {
    const gasFeeApprove = await this.getGasPriceProvider(
      swapContractAddr[0],
      amount,
      user
    );
    const gasFeeBuy = await this.getGasPriceProvider(
      wethAddr[0],
      parseUnits(amount, 18).toString(),
      swapProtocolAddr[0]
    );
    const totalGasFee = new BigNumberInBase(gasFeeBuy)
      .plus(gasFeeApprove)
      .toWei()
      .toString();

    return String(`${totalGasFee} wei`);
  }

  async sellTokens(
    user: string,
    amount: string,
    address: string,
    privateKey: string,
    slippage: string,
    priority: number
  ) {
    try {
      // @ts-ignore
      // const { route } = await this.estimateBuy(amount, address)
      // if (!route)
      //   throw new Error(`could not find route to swap ${amount} ${address}`)

      // const { coins, contract, execute_msg } = route
      // const message = MsgExecuteContractCompat.fromJSON({
      //   contractAddress: contract,
      //   sender: user,
      //   funds: coins,
      //   msg: execute_msg,
      // })

      // const txResponse = await new MsgBroadcasterWithPk({
      //   privateKey: privateKey,
      //   network: NETWORK,
      // }).broadcast({ msgs: message })

      // if (txResponse.code !== 0) {
      //   throw new Error(`Transaction failed: ${txResponse.rawLog}`)
      // } else {
      //   return txResponse.txHash
      // }

      const returnValue = await this.estimateSell(amount, address);

      if (returnValue === 'error') {
        throw new Error();
      }

      const { amount: estimatedAmount } = returnValue;

      const msg = await getSellSwapMsg(
        this.chainGrpcWasmApi,
        user,
        String(estimatedAmount),
        address
      );
      return this.broadcastMessage(msg, privateKey);
    } catch (error) {
      console.error({
        message: 'sellTokens failed',
        err: error,
      });
      return 'error';
    }
  }

  async calcGasTokenSell(
    user: string,
    amount: string,
    address: string,
    pKey: string,
    slippage: string
  ) {
    try {
      const gasFeeApprove = await this.getGasPriceProvider(
        swapContractAddr[0],
        amount,
        user
      );
      const gasFeeBuy = await this.getGasPriceProvider(
        wethAddr[0],
        parseUnits(amount, 18).toString(),
        swapProtocolAddr[0]
      );
      const totalGasFee = new BigNumberInBase(gasFeeBuy)
        .plus(gasFeeApprove)
        .toWei()
        .toString();

      return String(`${totalGasFee} wei`);
    } catch (error) {
      return 'error';
    }
  }

  getValue = async (userAddress: string, address: string) => {
    try {
      const balance = await this.chainBankApiGrpc.fetchBalance({
        accountAddress: userAddress,
        denom: address,
      });

      return balance.amount.toString();
    } catch (error) {
      return '0';
    }
  };

  async getSellList(user: string, address: string) {
    const tokenName = await this.getTokenName(address);
    const tokenSymbol = await this.getTokenSymbol(address);
    const profit = `${await calculatePNL(address, user, Chain.INJECTIVE)} ETH`;

    const amount = await this.getTokenPrice(address);
    const value = String(amount);

    const profitValue = await calculatePNL(address, user, Chain.INJECTIVE);

    const mcap = await this.calcMarketCap(address);

    const netProfit = `${profitValue} INJ`;

    const chain = this.chain();

    const balance = await this.getValue(user, address);
    const decimals = await this.getDecimals(address);

    const walletAmount = await this.getBalance(user);

    const nativeCurrency = this.nativeCurrency();

    return {
      tokenSymbol,
      tokenName,
      address,
      profit,
      value,
      mcap,
      timeProfit: '',
      netProfit,
      initial: '',
      chain,
      balance: formatUnits(balance, decimals),
      walletBalance: walletAmount,
      nativeCurrency,
    };
  }

  async estimateBuy(amount: string, token: string) {
    try {
      // const apiUrl = new URL(DOJOSWAP_SWAP_API_URL)
      // const params = {
      //   from: 'inj',
      //   to: token,
      //   amount,
      //   max_spread: 0.005,
      //   belief_price: 0,
      //   sender: '',
      //   deadline: Math.floor(Date.now() / 1000 + 5 * 60), // 5 minute deadline
      // }
      // for (let [name, value] of Object.entries(params))
      //   apiUrl.searchParams.set(name, value.toString())

      // let routes = (await fetch(apiUrl).then((r) => r.json())) as [
      //   DojoSwapResponse,
      // ][]

      // let rawAmountIn = BigInt(Number(amount) * 1e18)
      // let queries = routes.map(([{ value }]) => {
      //   const { swap, execute_swap_operations } = value.execute_msg
      //   let data
      //   if (execute_swap_operations)
      //     data = {
      //       simulate_swap_operations: {
      //         offer_amount: rawAmountIn.toString(),
      //         operations: execute_swap_operations.operations,
      //       },
      //     }
      //   else if (swap)
      //     data = {
      //       simulation: {
      //         offer_asset: swap.offer_asset,
      //       },
      //     }
      //   else
      //     throw new Error(
      //       `unexpected execute_msg: ${Object.keys(value.execute_msg)}`
      //     )

      //   return {
      //     address: value.contract,
      //     data,
      //   }
      // })

      // let queryBatches = []
      // while (queries.length > 0) queryBatches.push(queries.splice(0, 3))
      // let simulationResults = await Promise.all(
      //   queryBatches.map((batch) =>
      //     queryDojoswap<DojoSimulationResponse>(
      //       this.chainGrpcWasmApi,
      //       DOJOSWAP_CONTRACT,
      //       batch
      //     )
      //   )
      // ).then((batches) => batches.flat())

      // let bestRouteAmount = 0n
      // let bestRouteIndex = 0
      // for (let i = 0; i < routes.length; i++) {
      //   let { success, data } = simulationResults[i]
      //   if (!success || !data) {
      //     console.warn('simulation failed for route', routes[i], data)
      //     continue
      //   }
      //   let amount = BigInt(data?.return_amount ?? data?.amount ?? 0)
      //   if (bestRouteAmount < amount) {
      //     bestRouteAmount = amount
      //     bestRouteIndex = i
      //   }
      // }

      // const tokenDetails = await this.denomClient.getDenomToken(token)
      // if (!tokenDetails) {
      //   throw new Error()
      // }
      // const { decimals } = tokenDetails
      // const bestAmountUi = Number(bestRouteAmount) / 10 ** decimals
      // return {
      //   route: routes[bestRouteIndex][0]?.value,
      //   simulation: simulationResults[bestRouteIndex],
      //   amount: bestAmountUi,
      //   rawAmountIn,
      //   rawAmountOut: bestRouteAmount,
      // }
      const rawAmountIn = BigInt(Number(amount) * 1e18);
      const { expected_fees, result_quantity } = await estimateBuy(
        this.chainGrpcWasmApi,
        rawAmountIn.toString(),
        token
      );
      return {
        amount: result_quantity,
        rawAmountIn,
        rawAmountOut: result_quantity,
      };
    } catch (error) {
      console.error(error);
      return 'error';
    }
  }

  async estimateSell(amount: string, token: string) {
    try {
      const tokenDecimals = await this.getDecimals(token);

      if (tokenDecimals === 'error') {
        throw new Error();
      }

      const rawAmountIn = BigInt(Number(amount) * Math.pow(10, tokenDecimals));

      const res = await estimateSell(
        this.chainGrpcWasmApi,
        rawAmountIn.toString(),
        token
      );

      const { result_quantity, amount: targetAmount } = res;

      return {
        amount: targetAmount,
        rawAmountIn,
        rawAmountOut: result_quantity,
      };
    } catch (error) {
      console.error(error, 123);
      return 'error';
    }
  }

  calcMarketCap = async (address: string) => {
    try {
      const { amount } = await this.chainBankApiGrpc.fetchSupplyOf(address);
      const tokenPrice = await this.getTokenPrice(address);

      return `$ ${Number(tokenPrice) * Number(amount)}`;
    } catch (e) {
      console.error({
        message: 'calcMarketCap failed',
        err: e,
      });
      return 'error';
    }
  };

  isValidContract = async (tokenAddress: string) => {
    try {
      const token = await this.denomClient.getDenomToken(tokenAddress);

      if (!token) {
        return false;
      }

      return ['tokenFactory', 'cw20', 'erc20'].includes(token.tokenType);
    } catch (error) {
      return false;
    }
  };

  getPositionTokenAddresses = async (user: string, minPosValue: number) => {
    const positions = await getPositions(user, Chain.INJECTIVE);
    const tokenPriceMap = await this.getTokenPriceMap(
      positions.map(({ destination }) => destination)
    );

    const positionArray: Pick<Position, 'id' | 'address'>[] = [];
    for (const { destination, txnId } of positions)
      if ((tokenPriceMap.get(destination) ?? 0) >= Number(minPosValue))
        positionArray.push({
          id: txnId,
          address: destination,
        });
    return positionArray;
  };

  getPosition = async (user: string, minPosValue: number) => {
    let result = await getPositions(user, Chain.INJECTIVE);
    const positionArray: Position[] = [];
    while (result && result.length > 0) {
      const address = result[0].destination;
      const tokenPriceInEth = await this.getTokenPrice(address);
      if (Number(tokenPriceInEth) < Number(minPosValue)) {
        result = result.filter((item) => item.destination !== address);
        // eslint-disable-next-line no-continue
        continue;
      }
      const tokenName = await this.getTokenName(address);
      const tokenSymbol = await this.getTokenSymbol(address);
      const profitValue = await calculatePNL(address, user, Chain.INJECTIVE);
      const profit = `${profitValue}INJ`;
      const decimals = await this.getDecimals(address);
      const tokenPrice = await this.getValue(user, address);
      const mcap = await this.calcMarketCap(address);
      positionArray.push({
        id: result[0].txnId,
        address,
        value: formatUnits(String(tokenPrice), decimals),
        tokenName,
        tokenSymbol,
        profit,
        mcap: String(mcap),
        tokenPrice: tokenPriceInEth,
      });
      result = result.filter((item) => item.destination !== address);
    }
    return positionArray;
  };
}
