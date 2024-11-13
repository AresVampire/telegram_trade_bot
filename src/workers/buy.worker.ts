import { Action, Chain } from '@prisma/client';
import { Queue, Worker } from 'bullmq';

import { getExplorerLink, selectChainFromCtx } from '~/bot/helpers/utils';

import { IConnection, IQueueReturnData, IWorkerParams } from './types/workers';

export interface TBuyData {
  userId: number;
  tokenId: number;
  tokenAddress: string;
  userPublicAddress: string;
  tokenAmount: string;
  nativeAmount: string;
  walletPrivateKey: string;
  buySlippage: string;
  tokenPrice: string;
  tokenName: string;
  priority: number;
  chain: string;
}

export const BUY_QUEUE_NAME = 'buy-queue';

export interface IBuyReturnObject extends IQueueReturnData {
  tx: string;
  transactionLink: string;
}

export function createBuyQueue({ connection }: IConnection) {
  return new Queue<TBuyData>(BUY_QUEUE_NAME, { connection });
}

/**
 * Creates a worker that processes jobs from said queue
 *
 * @param connection Redis connection
 * @param handleError Global error handler
 * @param container Container that includes prisma and logger
 * @returns void
 */
export function createBuyWorker({
  connection,
  handleError,
  container,
}: IWorkerParams) {
  return new Worker<TBuyData>(
    BUY_QUEUE_NAME,
    async (job) => {
      const {
        tokenId,
        tokenAddress,
        tokenAmount,
        nativeAmount,
        walletPrivateKey,
        userPublicAddress,
        buySlippage,
        userId,
        tokenPrice,
        tokenName,
        priority,
        chain,
      } = job.data;

      try {
        const tx = await selectChainFromCtx(chain).buyTokens(
          userPublicAddress,
          walletPrivateKey,
          tokenAmount,
          tokenAddress,
          String(buySlippage),
          priority
        );

        if (!tx || tx === 'error') {
          throw new Error();
        }

        await container.prisma.transaction.create({
          data: {
            txnId: tx,
            userId: BigInt(userId),
            from: userPublicAddress.toLowerCase(),
            destination: tokenAddress.toLowerCase(),
            actionType: Action.BUY,
            timeStamp: new Date(),
            tokenAmount: String(tokenAmount),
            nativeAmount: String(nativeAmount),
            price: tokenPrice,
            tokenId: BigInt(tokenId),
            chain: chain as Chain,
          },
        });

        const transactionLink = getExplorerLink(chain, tx!);

        return {
          success: true,
          tx,
          transactionLink,
        };
      } catch (error) {
        handleError(job, error as Error);
        return {
          success: false,
          tx: '',
          transactionLink: '',
        };
      }
    },
    { connection }
  );
}
