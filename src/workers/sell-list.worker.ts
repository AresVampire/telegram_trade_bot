import { Queue, Worker } from 'bullmq';

import { selectChainFromCtx } from '~/bot/helpers/utils';

import { IConnection, IWorkerParams } from './types/workers';

export interface TSellListData {
  chain: string;
  userPublicAddress: string;
  tokenAddress: string;
}

export const SELL_LIST_QUEUE_NAME = 'sell-list-queue';

export function createSellListQueue({ connection }: IConnection) {
  return new Queue<TSellListData>(SELL_LIST_QUEUE_NAME, { connection });
}

/**
 * Creates a worker that processes jobs from said queue
 *
 * @param connection Redis connection
 * @param handleError Global error handler
 * @returns void
 */
export function createSellListWorker({
  connection,
  handleError,
}: IWorkerParams) {
  return new Worker<TSellListData>(
    SELL_LIST_QUEUE_NAME,
    async (job) => {
      const { chain, userPublicAddress, tokenAddress } = job.data;

      try {
        const info = await selectChainFromCtx(chain).getSellList(
          userPublicAddress,
          tokenAddress
        );
        return info;
      } catch (error) {
        handleError(job, error as Error);
      }
    },
    { connection }
  );
}
