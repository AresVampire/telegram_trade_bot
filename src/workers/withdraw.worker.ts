import { Queue, Worker } from 'bullmq';

import { getExplorerLink, selectChainFromCtx } from '~/bot/helpers/utils';

import { IConnection, IQueueReturnData, IWorkerParams } from './types/workers';

export interface TWithdrawData {
  priority: number;
  tokenAddress: string;
  tokenAmount: string;
  walletPrivateKey: string;
  chain: string;
}

export interface IWithdrawReturnObject extends IQueueReturnData {
  hash: string;
  transactionLink: string;
}

export const WITHDRAW_QUEUE_NAME = 'withdraw-queue';

export function createWithdrawQueue({ connection }: IConnection) {
  return new Queue<TWithdrawData, IWithdrawReturnObject>(WITHDRAW_QUEUE_NAME, {
    connection,
  });
}

/**
 * Creates a worker that processes jobs from said queue
 *
 * @param connection Redis connection
 * @param handleError Global error handler
 * @returns void
 */
export function createWithdrawWorker({
  connection,
  handleError,
}: IWorkerParams) {
  return new Worker<TWithdrawData>(
    WITHDRAW_QUEUE_NAME,
    async (job) => {
      const { tokenAddress, tokenAmount, walletPrivateKey, priority, chain } =
        job.data;

      try {
        const hash = await selectChainFromCtx(chain).withdraw(
          walletPrivateKey,
          tokenAddress,
          tokenAmount,
          priority
        );

        const transactionLink = getExplorerLink(chain, hash!);

        return {
          success: true,
          hash,
          transactionLink: transactionLink,
        };
      } catch (error) {
        handleError(job, error as Error);
        return {
          success: false,
          hash: '',
          transactionLink: '',
        };
      }
    },
    { connection }
  );
}
