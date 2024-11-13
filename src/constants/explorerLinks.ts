import { Chain } from '@prisma/client';

export const EXPLORER_LINKS: Record<string, string> = {
  [Chain.ETHEREUM]: 'https://etherscan.io/',
  [Chain.BINANCE]: 'https://bscscan.com/',
  [Chain.INJECTIVE]: 'https://explorer.injective.network/account/',
};
