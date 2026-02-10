import cors from 'cors';
import "dotenv/config";
import express from 'express';
import userRouter from './routers/user.js';
import workerRouter from './routers/worker.js';



const app = express();

app.use(express.json());
app.use(cors())

app.use("/v1/user", userRouter);
app.use("/v1/worker", workerRouter);

app.listen(3001, () => {
    console.log("Server is running on port 3001");
})