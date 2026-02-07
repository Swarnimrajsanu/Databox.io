import { S3Client, } from "@aws-sdk/client-s3";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
import { PrismaClient } from '@prisma/client';
import "dotenv/config";
import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { TOTAL_DECIMALS } from "../config.js";
import { authMiddleware } from '../middleware.js';
import { createTaskInput } from "../types.js";

const DEFAULT_TITLE = "Select the most clickable thumbnail";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}


const JWT_SECRET = "billubadmosh"

const router = Router();

const prisma = new PrismaClient({});

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});


router.get("/task", authMiddleware, async (req, res) => {
    // @ts-ignore
    const taskId: string = req.query.taskId;
    // @ts-ignore
    const userId: string = req.userId;

    const taskDetails = await prisma.task.findFirst({
        where: {
            user_id: Number(userId),
            id: Number(taskId)
        },
        include: {
            options: true
        }
    })

    if (!taskDetails) {
        return res.status(411).json({
            message: "You dont have access to this task"
        })
    }

    // Todo: Can u make this faster?
    const responses = await prisma.submission.findMany({
        where: {
            task_id: Number(taskId)
        },
        include: {
            option: true
        }
    });

    const result: Record<string, {
        count: number;
        option: {
            imageUrl: string
        }
    }> = {};

    taskDetails.options.forEach(option => {
        result[option.id] = {
            count: 0,
            option: {
                imageUrl: option.image_url
            }
        }
    })

    responses.forEach(r => {
        result[r.option_id].count++;
    });

    res.json({
        result,
        taskDetails
    })

})

router.post("/task", authMiddleware, async (req, res) => {
    const userId = Number(req.userId);
    const body = req.body;

    const parseData = createTaskInput.safeParse(body);

    const user = await prisma.user.findFirst({
        where: {
            id: userId,
        },
    })

    if (!parseData.success) {
        return res.status(411).json({ message: "You have send wrong input" });
    }

    let response = await prisma.$transaction(async tx => {
        const response = await tx.task.create({
            data: {
                title: parseData.data.title ?? DEFAULT_TITLE,
                amount : 0.1 * TOTAL_DECIMALS,
                signature: parseData.data.signature,
                user_id: userId
            }
        });

        await tx.option.createMany({
            data: parseData.data.options.map((option) => ({
                image_url: option.imageUrl,
                task_id: response.id,
            }))
        })

        return response;
    })

    res.json({
        id: response.id
    })

})

router.get("/presignedUrl", authMiddleware, async (req,res) => { 
    const userId = req.userId;

    const { url, fields } = await createPresignedPost(s3Client, {
        Bucket: 'task-to-reward',
        Key: `thumbnails/${userId}/${Math.random()}/image.jpg`, // Use backticks, not single quotes
        Conditions: [
          ['content-length-range', 0, 5 * 1024 * 1024] // 5 MB max
        ],
        Fields: {
            'Content-Type': 'image/jpeg'
        },
        Expires: 3600
    })

    res.json({
        preSignedUrl: url,
        fields: fields // Return fields to client as well
    })
})

//sigin with wallet
//signing a message

router.post("/signin", async (req, res) => {
        const hardcoderWalletAddress = "GiTMh2s9Ynk8wVtYcjPCpzwKJiVapre2rQTNuaiob9dh"

        const existingUser = await prisma.user.findFirst({
            where: {
                address: hardcoderWalletAddress
            }
        })

        if (existingUser) {

            const token = jwt.sign({
                userId: existingUser.id,
            }, JWT_SECRET)
            res.json({ token })
        } else {
            const user = await prisma.user.create({
                data: {
                    address: hardcoderWalletAddress
                }
            })

            const token = jwt.sign({
                userId: user.id,
            }, JWT_SECRET)
            res.json({ token })
        }
            
    });

export default router;

