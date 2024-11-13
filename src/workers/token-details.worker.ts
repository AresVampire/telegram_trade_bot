import { Queue, Worker } from 'bullmq';

import { selectChainFromCtx } from '~/bot/helpers/utils';

import { IConnection, IQueueReturnData, IWorkerParams } from './types/workers';

export interface TTokenDetailsData {
  chain: string;
  tokenAddress: string;
  includes?: ('mcap' | 'tokenName' | 'tokenPrice')[];
}

export interface ITokenDetailsWorkerReturnObject extends IQueueReturnData {
  tokenName: string;
  tokenPrice: string;
  mcap: number | string;
}

export const TOKEN_DETAILS_QUEUE_NAME = 'token-details-queue';

export function createTokenDetailsQueue({ connection }: IConnection) {
  return new Queue<TTokenDetailsData, ITokenDetailsWorkerReturnObject>(
    TOKEN_DETAILS_QUEUE_NAME,
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
export function createTokenDetailsWorker({
  connection,
  handleError,
}: IWorkerParams) {
  return new Worker<
    TTokenDetailsData,
    ITokenDetailsWorkerReturnObject | undefined
  >(
    TOKEN_DETAILS_QUEUE_NAME,
    async (job) => {
      const {
        chain,
        tokenAddress,
        includes = ['mcap', 'tokenName', 'tokenPrice'],
      } = job.data;

      try {
        const returningObject: ITokenDetailsWorkerReturnObject =
          {} as ITokenDetailsWorkerReturnObject;

        if (includes.includes('tokenName')) {
          const tokenName =
            await selectChainFromCtx(chain).getTokenName(tokenAddress);

          if (tokenName === 'error') {
            returningObject.success = false;
          } else {
            returningObject.success = true;
            returningObject.tokenName = tokenName;
          }
        }

        if (includes.includes('tokenPrice')) {
          const tokenPrice =
            await selectChainFromCtx(chain).getTokenPrice(tokenAddress);
          if (tokenPrice === 'error') {
            returningObject.success = false;
            returningObject.tokenName = '';
          } else {
            returningObject.success = true;
            returningObject.tokenPrice = tokenPrice;
          }
        }

        if (includes.includes('mcap')) {
          const mcap =
            await selectChainFromCtx(chain).calcMarketCap(tokenAddress);
          if (mcap === 'error') {
            returningObject.success = false;
            returningObject.tokenName = '';
            returningObject.tokenPrice = '';
          } else {
            returningObject.success = true;
            returningObject.mcap = mcap;
          }
        }

        return returningObject;
      } catch (error) {
        console.log(error, 'errrrrrrr');

        handleError(job, error as Error);
      }
    },
    { connection }
  );
}
