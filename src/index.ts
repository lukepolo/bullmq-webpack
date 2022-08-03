import express from "express";
import { createBullBoard } from "@bull-board/api";
import { QueuePro } from "@taskforcesh/bullmq-pro";
import { ExpressAdapter } from "@bull-board/express";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";

const defaultQueue = new QueuePro("default", {
  connection: {
    port: 6386,
  },
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


defaultQueue.add('myJobName', { foo: 'bar' });

// run wokrer too
import { Worker } from 'bullmq';

const worker = new Worker(queueName, async job => {
  // Will print { foo: 'bar'} for the first job
  // and { qux: 'baz' } for the second.
  console.log(job.data);
});
