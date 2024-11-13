import {
  ChainGrpcWasmApi,
  MsgExecuteContractCompat,
  SpotMarket,
} from '@injectivelabs/sdk-ts';

import { MITOSWAP_CONTRACT } from '~/constants/injective';

import { resolveTokenDenom } from '../metadata';
import { queryContract } from './queryContract';

interface MitoSimulationResponse {
  result_quantity: string;
  expected_fees: {
    amount: string;
    denom: string;
  }[];
}

interface MitoRouteResponse {
  steps: string[];
}

const MITOSWAP_MARKET_URL =
  'https://injective-nuxt-api.vercel.app/api/spot/markets';
async function getMarkets(): Promise<SpotMarket[]> {
  return fetch(MITOSWAP_MARKET_URL).then((r) => r.json()) as Promise<
    SpotMarket[]
  >;
}

export interface EstimateSwapArgs {
  chainGrpcWasmApi: ChainGrpcWasmApi;
  amount: string;
  source_denom: string;
  target_denom: string;
}
export async function estimateSwap({
  chainGrpcWasmApi,
  amount,
  source_denom,
  target_denom,
}: EstimateSwapArgs) {
  source_denom = await resolveTokenDenom(source_denom);
  target_denom = await resolveTokenDenom(target_denom);

  let simulationResponse = await queryContract<MitoRouteResponse>(
    chainGrpcWasmApi,
    MITOSWAP_CONTRACT,
    {
      get_route: {
        source_denom,
        target_denom,
      },
    }
  );

  let markets = await getMarkets();
  let routeMarkets = simulationResponse.steps.map((marketId) =>
    markets.find((market) => market.marketId == marketId)
  );

  let amountMultiple = -1;
  for (let market of routeMarkets) {
    if (!market?.baseToken || !market?.quoteToken) continue;
    let marketAmountMultiple =
      10 **
      (-Math.floor(Math.log10(Number(market.minPriceTickSize))) -
        market.baseToken.decimals +
        market.quoteToken.decimals);
    amountMultiple = Math.max(amountMultiple, marketAmountMultiple);
  }

  amount = (
    Math.floor(parseFloat(amount) / amountMultiple) * amountMultiple
  ).toFixed(0);

  let swapOutput = await queryContract<MitoSimulationResponse>(
    chainGrpcWasmApi,
    MITOSWAP_CONTRACT,
    {
      get_output_quantity: {
        from_quantity: amount,
        source_denom,
        target_denom,
      },
    }
  );

  return {
    amount,
    ...swapOutput,
  };
}

export async function estimateBuy(
  chainGrpcWasmApi: ChainGrpcWasmApi,
  amount: string,
  token: string
) {
  return estimateSwap({
    chainGrpcWasmApi,
    amount,
    source_denom: 'inj',
    target_denom: token,
  });
}

export async function estimateSell(
  chainGrpcWasmApi: ChainGrpcWasmApi,
  amount: string,
  token: string
) {
  return estimateSwap({
    chainGrpcWasmApi,
    amount,
    source_denom: token,
    target_denom: 'inj',
  });
}

export interface GetSwapMsgArgs {
  chainGrpcWasmApi: ChainGrpcWasmApi;
  sender: string;
  amount: string;
  source_denom: string;
  target_denom: string;
  slippage?: number;
}
export async function getSwapMsg({
  chainGrpcWasmApi,
  sender,
  amount,
  source_denom,
  target_denom,
  slippage = 0.01,
}: GetSwapMsgArgs) {
  source_denom = await resolveTokenDenom(source_denom);
  target_denom = await resolveTokenDenom(target_denom);

  let estimate = await estimateSwap({
    chainGrpcWasmApi,
    amount,
    source_denom,
    target_denom,
  });

  return MsgExecuteContractCompat.fromJSON({
    contractAddress: MITOSWAP_CONTRACT,
    sender,
    funds: [
      {
        amount: estimate.amount,
        denom: source_denom,
      },
    ],
    msg: {
      swap_min_output: {
        min_output_quantity: Math.floor(
          parseFloat(estimate.result_quantity) * (1 - slippage)
        ).toString(),
        target_denom,
      },
    },
  });
}

export async function getBuySwapMsg(
  chainGrpcWasmApi: ChainGrpcWasmApi,
  sender: string,
  amount: string,
  token: string
) {
  return getSwapMsg({
    chainGrpcWasmApi,
    sender,
    amount,
    source_denom: 'inj',
    target_denom: token,
  });
}

export async function getSellSwapMsg(
  chainGrpcWasmApi: ChainGrpcWasmApi,
  sender: string,
  amount: string,
  token: string
) {
  return getSwapMsg({
    chainGrpcWasmApi,
    sender,
    amount,
    source_denom: token,
    target_denom: 'inj',
  });
}
