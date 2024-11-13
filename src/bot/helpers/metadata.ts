import {
  isDevnet,
  isMainnet,
  isTestnet,
  Network,
} from '@injectivelabs/networks';

import { NETWORK } from '~/constants/injective';

export function getTokenMetadataMapUrl(network: Network): string {
  if (isDevnet(network))
    return 'https://raw.githubusercontent.com/InjectiveLabs/injective-lists/master/tokens/devnet.json';
  else if (isMainnet(network))
    return 'https://raw.githubusercontent.com/InjectiveLabs/injective-lists/master/tokens/mainnet.json';
  else if (isTestnet(network))
    return 'https://raw.githubusercontent.com/InjectiveLabs/injective-lists/master/tokens/testnet.json';
  throw new Error(`unrecognized network: ${network}`);
}

export interface TokenMetadata {
  denom?: string;
  tokenType: string;
  address: string;
  coinGeckoId: string;
  name: string;
  symbol: string;
  decimals: number;
  logo: string;
}

const cachedMetadataMap = {
  promise: undefined as Promise<TokenMetadata[]> | undefined,
  timestamp: 0,
};
const METADATA_MAP_MAX_AGE = 10 * 60 * 1000; // 10 minutes
export async function fetchTokenMetadataMap(
  force: boolean = false,
  network: Network = NETWORK
): Promise<TokenMetadata[]> {
  if (
    !cachedMetadataMap.promise ||
    Date.now() > cachedMetadataMap.timestamp + METADATA_MAP_MAX_AGE ||
    force
  ) {
    cachedMetadataMap.timestamp = Date.now();
    cachedMetadataMap.promise = fetch(getTokenMetadataMapUrl(network)).then(
      (r) => r.json()
    ) as Promise<TokenMetadata[]>;
  }

  return cachedMetadataMap.promise;
}

export async function resolveTokenDenom(
  contractAddress: string,
  force?: boolean
): Promise<string> {
  const tokenMetadataMap = await fetchTokenMetadataMap(force);
  const token = tokenMetadataMap.find(
    ({ address }) => address == contractAddress
  );
  if (token?.denom) contractAddress = token.denom;
  return contractAddress;
}
