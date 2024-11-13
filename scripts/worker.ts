import { Job, Worker } from 'bullmq';
import { onShutdown } from 'node-graceful-shutdown';

import { createContainer } from '~/container';
import { redisConnection } from '~/redis';
import {
  createBuyWorker,
  createEstimateBuyWorker,
  createPositionsWorker,
  createSellListWorker,
  createSellTokenGasWorker,
  createSellWorker,
  createTokenDetailsWorker,
  createUserDetailsWorker,
  createWithdrawWorker,
} from '~/workers';

const container = createContainer();

const workers: Worker[] = [];

export const run = async () => {
  const handleWorkerError = (job: Job | undefined, err: Error) => {
    container.logger.error({
      msg: `job failed`,
      job_id: job?.id,
      job_name: job?.name,
      queue: job?.queueName,
      err,
    });
  };

  onShutdown(async () => {
    container.logger.info('shutting down...');
    await Promise.all(workers.map((worker) => worker.close()));
  });

  const workerParams = {
    connection: redisConnection,
    handleError: handleWorkerError,
    container,
  };
  workers.push(
    createUserDetailsWorker(workerParams),
    createWithdrawWorker(workerParams),
    createSellWorker(workerParams),
    createBuyWorker(workerParams),
    createPositionsWorker(workerParams),
    createSellListWorker(workerParams),
    createTokenDetailsWorker(workerParams),
    createEstimateBuyWorker(workerParams),
    createSellTokenGasWorker(workerParams)
  );

  container.logger.info('launching workers');
};

run().catch((err) => {
  container.logger.error(err);
  process.exit(1);
});
