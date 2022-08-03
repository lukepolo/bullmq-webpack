import express from "express";
import IORedis from "ioredis";
import { createBullBoard } from "@bull-board/api";
import { ExpressAdapter } from "@bull-board/express";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
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
  port: 6386,
  enableReadyCheck: false,
  enableOfflineQueue: true,
  maxRetriesPerRequest: null,
  showFriendlyErrorStack: true,
  retryStrategy() {
    return 5 * 1000;
  },
}

const connection = new IORedis(redisConnectionOptions);

const bullQueueOptions = {
  prefix,
  connection
  // connection: redisConnectionOptions,
};

const defaultQueue = new QueuePro(queueName, bullQueueOptions);

new FlowProducerPro(bullQueueOptions);

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath("/queues");

createBullBoard({
  serverAdapter,
  queues: [new BullMQAdapter(defaultQueue)],
});

const app = express();

app.use("/queues", serverAdapter.getRouter());

app.listen(3001, () => {
  console.log("open http://localhost:3001/queues");
});

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
process.once(DEV ? "SIGUSR2" : "SIGTERM", async () => {
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
