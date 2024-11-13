import { ChainGrpcWasmApi, fromBase64, toBase64 } from '@injectivelabs/sdk-ts';

import { queryContract } from './queryContract';

export interface DojoSwapResponse {
  type: 'wasm/MsgExecuteContract';
  value: {
    coins?: {
      amount: string;
      denom: string;
    }[];
    contract: string;
    execute_msg: {
      swap?: {
        offer_asset: object;
      };
      execute_swap_operations?: {
        operations: object;
      };
    };
    sender: string;
  };
}

export interface DojoSimulationResponse {
  amount?: string;
  return_amount?: string;
}

export async function queryDojoswap<R = object>(
  client: ChainGrpcWasmApi,
  contract: string,
  queries: {
    address: string;
    data: object;
  }[]
): Promise<{ success: boolean; data: R }> {
  const { return_data } = await queryContract<any>(client, contract, {
    aggregate: {
      queries: queries.map(({ address, data }) => ({
        address,
        data: toBase64(data),
      })),
    },
  });
  return return_data.map(({ success, data }: any) => ({
    success,
    data: fromBase64(data),
  }));
}
