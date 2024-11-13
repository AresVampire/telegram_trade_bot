import { Queue, Worker } from 'bullmq';
import { formatEther } from 'ethers';

import { selectChainFromCtx } from '~/bot/helpers/utils';

import { IConnection, IQueueReturnData, IWorkerParams } from './types/workers';

export interface TEstimateBuyData {
  chain: string;
  userPublicAddress: string;
  tokenAmount: string;
  tokenAddress: string;
  buySlippage: string;
  userBalance: string;
}

export const ESTIMATE_BUY_QUEUE_NAME = 'estimate-buy-queue';

export function createEstimateBuyQueue({ connection }: IConnection) {
  return new Queue<TEstimateBuyData>(ESTIMATE_BUY_QUEUE_NAME, { connection });
}

export interface IEstimateBuyReturnObject extends IQueueReturnData {
  address: string;
  amount: string;
  currency: string;
  currencyamt: string;
  gas: string;
  reason: 'LOW_BALANCE' | 'ERROR';
}

/**
 * Creates a worker that processes jobs from said queue
 *
 * @param connection Redis connection
 * @param handleError Global error handler
 * @returns void
 */
export function createEstimateBuyWorker({
  connection,
  handleError,
}: IWorkerParams) {
  return new Worker<TEstimateBuyData>(
    ESTIMATE_BUY_QUEUE_NAME,
    async (job) => {
      const {
        chain,
        userPublicAddress,
        tokenAmount,
        tokenAddress,
        buySlippage,
        userBalance,
      } = job.data;

      try {
        const gas = await selectChainFromCtx(chain).calcGasTokensBuy(
          userPublicAddress,
          tokenAmount,
          tokenAddress,
          buySlippage
        );

        if (gas === 'error') {
          throw new Error('Something went wrong');
        }

        const gasInEth = formatEther(gas.split(' ')[0]);

        if (Number(tokenAmount) < Number(userBalance) + Number(gasInEth)) {
          // session.token_amount = tokenAmount
          // @ts-ignore
          const { amount: estimation } = await selectChainFromCtx(
            chain
          ).estimateBuy(tokenAmount, tokenAddress);

          const coin = selectChainFromCtx(chain).nativeCurrency();

          return {
            success: true,
            address: tokenAddress,
            amount: estimation,
            currency: coin,
            currencyamt: tokenAmount,
            gas,
          };
        }
        return {
          success: false,
          reason: 'LOW_BALANCE',
          address: '',
          amount: '',
          currency: '',
          currencyamt: '',
          gas: '',
        };
      } catch (error) {
        handleError(job, error as Error);
        return {
          success: false,
          reason: 'ERROR',
          address: '',
          amount: '',
          currency: '',
          currencyamt: '',
          gas: '',
        };
      }
    },
    { connection }
  );
}
