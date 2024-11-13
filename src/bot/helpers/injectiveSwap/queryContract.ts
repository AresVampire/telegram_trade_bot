import { ChainGrpcWasmApi, toBase64 } from '@injectivelabs/sdk-ts';

export async function queryContract<R = object>(
  client: ChainGrpcWasmApi,
  contract: string,
  query: object
): Promise<R> {
  const response = await client.fetchSmartContractState(
    contract,
    toBase64(query)
  );
  return JSON.parse(Buffer.from(response.data).toString());
}
