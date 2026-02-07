import { PrismaClient } from '@prisma/client';
import "dotenv/config";
import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { getNextTask } from '../db.js';
import { workerMiddleware } from '../middleware.js';
import { createSubmissionInput } from '../types.js';
const TOTAL_SUBMISSIONS = 100;

const JWT_SECRET = "billubadmosh"
const router = Router();

export const WORKER_JWT_SECRET = JWT_SECRET + "worker";
const prisma = new PrismaClient({});

router.get("/balance", workerMiddleware, async (req, res) => {
    // @ts-ignore
    const userId: string = req.userId;

    const worker = await prisma.worker.findFirst({
        where: {
            id: Number(userId)
        }
    })

    res.json({
        pendingAmount: worker?.pending_amount,
        lockedAmount: worker?.pending_amount,
    })
})

router.post("/submission", workerMiddleware, async (req, res) => {
    // @ts-ignore
    const userId = Number(req.userId);
    const body = req.body;
    const parsedBody = createSubmissionInput.safeParse(body);

    if (parsedBody.success) {
        const task = await getNextTask(Number(userId));
        if (!task || task?.id !== Number(parsedBody.data.taskId)) {
            return res.status(411).json({
                message: "Incorrect task id"
            })
        }

        const amount = (Number(task.amount) / TOTAL_SUBMISSIONS).toString();

        const submission = await prisma.$transaction(async tx => {
            const submission = await tx.submission.create({
                data: {
                    option_id: Number(parsedBody.data.selection),
                    worker_id: userId,
                    task_id: Number(parsedBody.data.taskId),
                    amount: Number(amount)
                }
            })

            await tx.worker.update({
                where: {
                    id: userId,
                },
                data: {
                    pending_amount: {
                        increment: Number(amount)
                    }
                }
            })

            return submission;
        })

        const nextTask = await getNextTask(Number(userId));
        res.json({
            nextTask,
            amount
        })
        

    } else {
        res.status(411).json({
            message: "Incorrect inputs"
        })
            
    }

})

router.get("/nextTask", workerMiddleware, async (req, res) => {
    // @ts-ignore
    const userId: string = req.userId;

    const task = await getNextTask(Number(userId));

    if (!task) {
        res.status(411).json({   
            message: "No more tasks left for you to review"
        })
    } else {
        res.json({   
            task
        })
    }
})



router.post("/signin", async (req, res) => {
        const hardcoderWalletAddress = "GiTMh2s9Ynk8wVtYcjPCpzwKJiVapre2rQTNuaiob9dj"

        const existingUser = await prisma.worker.findFirst({
            where: {
                address: hardcoderWalletAddress,
                pending_amount: 0,
                locked_amount: 0
            }
        })

        if (existingUser) {

            const token = jwt.sign({
                userId: existingUser.id,
            }, WORKER_JWT_SECRET)
            res.json({ token })
        } else {
            const worker = await prisma.worker.create({
                data: {
                    address: hardcoderWalletAddress
                }
            })

            const token = jwt.sign({
                userId: worker.id,
            }, WORKER_JWT_SECRET)
            res.json({ token })
        }
            
    });

export default router;