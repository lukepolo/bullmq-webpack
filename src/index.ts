import express from "express";
import { createBullBoard } from "@bull-board/api";
import { QueuePro } from "@taskforcesh/bullmq-pro";
import { ExpressAdapter } from "@bull-board/express";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";

const connection = {
  port: 6386,
};
const defaultQueue = new QueuePro("default", {
  connection,
});

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath("/queues");

createBullBoard({
  serverAdapter,
  queues: [new BullMQAdapter(defaultQueue)],
});

const app = express();

app.use("/queues", serverAdapter.getRouter());

app.listen(3000, () => {
  console.log("open http://localhost:3000/queues");
});

defaultQueue.add("myJobName", { foo: "bar" });

import { Worker } from "bullmq";

new Worker(
  "default",
  async (job) => {
    console.log(`Process Job on Default`, job.data);
  },
  {
    connection,
  }
);
