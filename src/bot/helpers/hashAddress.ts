import crypto from 'crypto';

import { createPrisma } from '~/prisma';

export const hashAddress = async (address: string) => {
  try {
    const prismaClient = createPrisma();
    const addressHashed = crypto
      .createHash('sha1')
      .update(address)
      .digest('base64url');

    let hashedAddress = '';

    const foundAddressHash = await prismaClient.addressHashMap.findFirst({
      where: {
        address: address,
        OR: [{ hash: addressHashed }],
      },
    });

    if (!foundAddressHash) {
      await prismaClient.addressHashMap.create({
        data: {
          address: address,
          hash: addressHashed,
        },
      });
    }

    hashedAddress = addressHashed;

    return hashedAddress;
  } catch (error) {
    throw error;
  }
};

export const getHashedAddress = async (tokenAddressHash: string) => {
  const prismaClient = createPrisma();
  const foundAddressHash = await prismaClient.addressHashMap.findFirst({
    where: { hash: tokenAddressHash },
  });

  if (!foundAddressHash) {
    throw new Error('TOKEN_ADDRESS_NOT_FOUND');
  }

  return foundAddressHash.address;
};
