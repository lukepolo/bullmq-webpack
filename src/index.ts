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

const prefix = "lukepolo-1";
const queueName = "default";
const connection = new IORedis({
  db: 1,
  port: 6386,
  enableReadyCheck: false,
  enableOfflineQueue: true,
  maxRetriesPerRequest: null,
  showFriendlyErrorStack: true,
  retryStrategy() {
    return 5 * 1000;
  },
});

const bullQueueOptions = {
  prefix,
  connection,
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

new QueueSchedulerPro(queueName, {
  prefix,
  connection,
});

new WorkerPro(
  queueName,
  async (job) => {
    console.log(`Process Job on ${queueName}`, job.data);
  },
  Object.assign(bullQueueOptions)
);

setInterval(() => {
  defaultQueue.add("myJobName", { foo: "bar" });
}, 1000);
