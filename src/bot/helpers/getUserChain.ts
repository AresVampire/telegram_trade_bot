import { Chain } from '@prisma/client';

import { createPrisma } from '~/prisma';

export const getUserChain = async (userId: number): Promise<Chain> => {
  const prismaClient = createPrisma();

  const user = await prismaClient.user.findFirst({ where: { userId } });

  if (!user) {
    return 'INJECTIVE';
  }

  return user.chain;
};
