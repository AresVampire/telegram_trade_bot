import { Provider } from 'ethers';

export const getPriorityValue = async (
  priority: 0 | 1 | 2 | number,
  provider: Provider
): Promise<bigint> => {
  const { gasPrice } = await provider.getFeeData();

  if (!gasPrice) {
    return 0n;
  }

  switch (priority) {
    case 0:
      return gasPrice;
    case 1:
      return gasPrice + (gasPrice * 5n) / 100n;
    case 2:
      return gasPrice + (gasPrice * 10n) / 100n;
    default:
      return gasPrice;
  }
};
