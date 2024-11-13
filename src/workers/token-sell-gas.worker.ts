import { Queue, Worker } from 'bullmq';

import { selectChainFromCtx } from '~/bot/helpers/utils';

import { IConnection, IQueueReturnData, IWorkerParams } from './types/workers';

export interface TSellTokenGasData {
  chain: string;
  userPublicAddress: string;
  tokenAmount: string;
  tokenAddress: string;
  sellSlippage: string;
  userPKey: string;
}

export interface ISellTokenGasReturnObject extends IQueueReturnData {
  gas: string;
}

export const SELL_TOKEN_GAS_QUEUE_NAME = 'sell-token-gas-queue';

export function createSellTokenGasQueue({ connection }: IConnection) {
  return new Queue<TSellTokenGasData, ISellTokenGasReturnObject>(
    SELL_TOKEN_GAS_QUEUE_NAME,
    { connection }
  );
}

/**
 * Creates a worker that processes jobs from said queue
 *
 * @param connection Redis connection
 * @param handleError Global error handler
 * @returns void
 */
export function createSellTokenGasWorker({
  connection,
  handleError,
}: IWorkerParams) {
  return new Worker<TSellTokenGasData, ISellTokenGasReturnObject>(
    SELL_TOKEN_GAS_QUEUE_NAME,
    async (job) => {
      const {
        chain,
        userPublicAddress,
        tokenAmount,
        tokenAddress,
        sellSlippage,
        userPKey,
      } = job.data;

      try {
        const gasFee = await selectChainFromCtx(chain).calcGasTokenSell(
          userPublicAddress,
          tokenAmount,
          tokenAddress,
          userPKey,
          sellSlippage
        );

        if (gasFee === 'error') {
          return {
            success: false,
            gas: '',
          };
        }

        return {
          success: true,
          gas: gasFee,
        };
      } catch (error) {
        handleError(job, error as Error);
        return {
          success: false,
          gas: '',
        };
      }
    },
    { connection }
  );
}
