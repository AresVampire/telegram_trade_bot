import { Queue, Worker } from 'bullmq';

import { selectChainFromCtx } from '~/bot/helpers/utils';

import { IConnection, IWorkerParams } from './types/workers';

export interface TPositionsData {
  userPublicAddress: string;
  posValue: number;
  chain: string;
}

export const POSITIONS_QUEUE_NAME = 'positions-queue';

export function createPositionsQueue({ connection }: IConnection) {
  return new Queue<TPositionsData>(POSITIONS_QUEUE_NAME, { connection });
}

/**
 * Creates a worker that processes jobs from said queue
 *
 * @param connection Redis connection
 * @param handleError Global error handler
 * @returns void
 */
export function createPositionsWorker({
  connection,
  handleError,
}: IWorkerParams) {
  return new Worker<TPositionsData>(
    POSITIONS_QUEUE_NAME,
    async (job) => {
      const { userPublicAddress, posValue, chain } = job.data;

      try {
        const positions = await selectChainFromCtx(
          chain
        ).getPositionTokenAddresses(
          String(userPublicAddress).toLowerCase(),
          posValue
        );

        if (!positions.length) {
          return null;
        }

        const { address } = positions[0];

        const info = await selectChainFromCtx(chain).getSellList(
          userPublicAddress,
          address as string
        );
        return info;
      } catch (error) {
        handleError(job, error as Error);
      }
    },
    { connection }
  );
}
