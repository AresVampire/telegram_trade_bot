import { Job } from 'bullmq';
import { CallbackQueryContext, ChatTypeContext, Context } from 'grammy';
import { Redis } from 'ioredis';

import { type Container } from '~/container';

export interface IConnection {
  connection: Redis;
}

export interface IWorkerParams {
  connection: Redis;
  handleError: (job: Job | undefined, err: Error) => void;
  container: Container;
}

export type TContext = CallbackQueryContext<
  ChatTypeContext<Context, 'private'>
>;

export interface IQueueReturnData {
  success: boolean;
}
