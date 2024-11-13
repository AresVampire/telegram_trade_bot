import { Action, type Chain, type Transaction } from '@prisma/client';

import { createPrisma } from '~/prisma';

export const calculatePNL = async (
  token: string,
  useraddress: string,
  chain: Chain
) => {
  const client = createPrisma();
  const result = await client.transaction.findMany({
    where: {
      from: useraddress,
      chain,
      destination: token,
    },
  });

  let totalAmount = 0;

  if (result && result.length > 0) {
    // eslint-disable-next-line array-callback-return
    result.map((item: Transaction) => {
      if (item.actionType === Action.BUY) {
        totalAmount -= Number(item.amount);
      } else {
        totalAmount += Number(item.amount);
      }
    });
  }

  return totalAmount;
};

export const getPositions = async (
  user: string,
  chain: Chain
): Promise<Transaction[]> => {
  const client = createPrisma();
  const result: Transaction[] = await client.transaction.findMany({
    where: {
      from: user,
      chain,
    },
  });

  return result;
};

export const getAddress = async (token: string) => {
  const client = createPrisma();
  const result: Transaction | null = await client.transaction.findFirst({
    where: { token },
  });
  return result!.destination;
};
