import { Queue, Worker } from 'bullmq';

import { decrypt, selectChainFromCtx } from '~/bot/helpers/utils';

import { IConnection, IQueueReturnData, IWorkerParams } from './types/workers';

export interface TUserDetailsData {
  chain: string;
  userId: number;
}

export interface IUserDetailsWorkerReturnObject extends IQueueReturnData {
  balance: string;
  chain: string;
  nativeCurrency: string;
  publicAddress: string;
}

export const USER_DETAILS_QUEUE_NAME = 'user-details-queue';

export function createUserDetailsQueue({ connection }: IConnection) {
  return new Queue<TUserDetailsData, IUserDetailsWorkerReturnObject>(
    USER_DETAILS_QUEUE_NAME,
    { connection }
  );
}

/**
 * Creates a worker that processes jobs from said queue
 *
 * @param connection Redis connection
 * @param handleError Global error handler
 * @param container Container that includes prisma and logger
 * @returns void
 */
export function createUserDetailsWorker({
  connection,
  handleError,
  container,
}: IWorkerParams) {
  return new Worker<TUserDetailsData>(
    USER_DETAILS_QUEUE_NAME,
    async (job): Promise<IUserDetailsWorkerReturnObject> => {
      const { chain, userId } = job.data;

      const user = await container.prisma.user.findFirst({ where: { userId } });

      if (!user) {
        throw new Error();
      }

      const { encryptedPrivateKey } = user;

      const { address } = await selectChainFromCtx(chain).importWallet(
        decrypt(encryptedPrivateKey!, userId).toString()
      );

      const nativeCurrency = selectChainFromCtx(chain).nativeCurrency();

      try {
        const balance = await selectChainFromCtx(chain).getBalance(address);

        return {
          success: true,
          balance,
          chain,
          nativeCurrency,
          publicAddress: address,
        };
      } catch (error) {
        handleError(job, error as Error);
        return {
          success: false,
          balance: '',
          chain,
          nativeCurrency,
          publicAddress: address,
        };
      }
    },
    { connection }
  );
}
