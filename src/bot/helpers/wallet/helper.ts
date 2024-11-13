import { Chain } from '@prisma/client';
import { Abi, Address, createPublicClient, http } from 'viem';
import { bscTestnet, sepolia } from 'viem/chains';

import { config } from '~/config';

export const isMethodExistProxy = async (
  chain: Chain,
  contractAddress: Address,
  methodABI: Abi,
  functionName: string,
  args?: any[]
) => {
  const publicClient = createPublicClient({
    chain: chain === 'ETHEREUM' ? sepolia : bscTestnet, // TODO: change
    transport: http(
      chain === 'ETHEREUM' ? config.ETHEREUM_NODE_URL : config.BINANCE_NODE_URL
    ),
  });
  try {
    await publicClient.simulateContract({
      address: contractAddress,
      abi: methodABI,
      functionName,
      args,
    });
    return true;
  } catch (e) {
    return false;
  }
};

export const wethAddr = [
  // WETH
  // '0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6',
  config.ETHEREUM_WRAPPED_TOKEN,
  // WBNB
  // '0xae13d989dac2f0debff460ac112a837c89baa7cd',
  config.BINANCE_WRAPPED_TOKEN,
];
export const swapProtocolAddr = [
  // Uniswap
  // '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
  config.ETHEREUM_SWAP_ADDRESS,
  // PancakeSwap
  // '0x9Ac64Cc6e4415144C455BD8E4837Fea55603e5c3',
  config.BINANCE_SWAP_ADDRESS,
];
export const swapContractAddr = [
  // Ethereum
  // '0x37434d8d574154871F132B6A84715a8689c83c10',
  config.ETHEREUM_PROXY_ADDRESS,
  // Binance
  // '0xf3A51ad46dB9e589fb65f815d3e6BC84152C0d1e',
  config.BINANCE_PROXY_ADDRESS,
];
