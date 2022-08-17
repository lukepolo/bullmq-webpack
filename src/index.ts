import IORedis from "ioredis";
import {
  QueuePro,
  WorkerPro,
  FlowProducerPro,
  QueueSchedulerPro,
} from "@taskforcesh/bullmq-pro";

const prefix = "lukepolo-2";
const queueName = "default";
const redisConnectionOptions = {
  db: 1,
  port: 6379,
  enableReadyCheck: false,
  enableOfflineQueue: true,
  maxRetriesPerRequest: null,
  showFriendlyErrorStack: true,
  retryStrategy() {
    return 5 * 1000;
  },
};

const connection = new IORedis(redisConnectionOptions);

const bullQueueOptions = {
  prefix,
  connection,
  // connection: redisConnectionOptions,
};

new FlowProducerPro(bullQueueOptions);
const defaultQueue = new QueuePro(queueName, bullQueueOptions);

new QueueSchedulerPro(queueName, bullQueueOptions);

const workers: Array<{
  queue: string;
  worker: WorkerPro;
}> = [];

workers.push({
  queue: queueName,
  worker: new WorkerPro(
    queueName,
    async (job) => {
      console.log(`Process Job on ${queueName}`, job.data);
    },
    bullQueueOptions
  ),
});

setInterval(() => {
  defaultQueue.add("myJobName", { foo: "bar" });
}, 1000);

/**
 * Setup shutdown procedure for when workers are running
 */
process.once("SIGUSR2", async () => {
  console.warn(`Gracefully Shutting Down...`);
  console.info(`---------------------------`);
  console.warn(`Stopping Workers...`);
  await Promise.all(
    workers.map(async ({ queue, worker }) => {
      console.info(`    [${queue}] stopping...`);
      await worker.close().catch((error) => {
        console.error(
          `        [${queue}] unable to shutdown worker gracefully`,
          error
        );
      });
      console.info(`    [${queue}] stopped`);
    })
  );
  console.info(`Stopped Workers`);
  console.info(`---------------------------`);

  process.exit(0);
});
