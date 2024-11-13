import { Action, Chain } from '@prisma/client';
import { Queue, Worker } from 'bullmq';
import { formatUnits } from 'viem';

import { getExplorerLink, selectChainFromCtx } from '~/bot/helpers/utils';

import { IConnection, IQueueReturnData, IWorkerParams } from './types/workers';

export interface TSellData {
  userId: number;
  tokenId: number;
  tokenAddress: string;
  userPublicAddress: string;
  tokenAmount: string;
  nativeAmount: string;
  walletPrivateKey: string;
  sellSlippage: string;
  tokenPrice: string;
  priority: number;
  chain: string;
}

export interface ISellReturnObject extends IQueueReturnData {
  tx: string;
  transactionLink: string;
}

export const SELL_QUEUE_NAME = 'sell-queue';

export function createSellQueue({ connection }: IConnection) {
  return new Queue<TSellData, ISellReturnObject>(SELL_QUEUE_NAME, {
    connection,
  });
}

/**
 * Creates a worker that processes jobs from said queue
 *
 * @param connection Redis connection
 * @param handleError Global error handler
 * @param container Container that includes prisma and logger
 * @returns void
 */
export function createSellWorker({
  connection,
  handleError,
  container,
}: IWorkerParams) {
  return new Worker<TSellData>(
    SELL_QUEUE_NAME,
    async (job) => {
      const {
        tokenId,
        tokenAddress,
        tokenAmount,
        nativeAmount,
        walletPrivateKey,
        userPublicAddress,
        sellSlippage,
        userId,
        tokenPrice,
        priority,
        chain,
      } = job.data;

      try {
        const estimatedSellValue = await selectChainFromCtx(chain).estimateSell(
          String(tokenAmount),
          String(tokenAddress)
        );

        if (estimatedSellValue === 'error') {
          throw new Error();
        }

        // @ts-ignore
        const outAmount = formatUnits(estimatedSellValue.rawAmountOut, 18);

        const tx = await selectChainFromCtx(chain).sellTokens(
          userPublicAddress,
          tokenAmount,
          tokenAddress,
          walletPrivateKey,
          String(sellSlippage),
          priority
        );

        if (tx === 'error') {
          throw new Error();
        }

        await container.prisma.transaction.create({
          data: {
            txnId: tx,
            userId: BigInt(userId),
            from: userPublicAddress.toLowerCase(),
            destination: tokenAddress.toLowerCase(),
            actionType: Action.SELL,
            timeStamp: new Date(),
            tokenAmount: String(outAmount),
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
