import { config } from '~/config';
import { createLogger } from '~/logger';
import { createPrisma } from '~/prisma';

export const createContainer = () => {
  const logger = createLogger(config);
  const prisma = createPrisma(logger);

  return {
    logger,
    prisma,
  };
};

export type Container = ReturnType<typeof createContainer>;
