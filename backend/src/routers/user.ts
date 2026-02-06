import { S3Client, } from "@aws-sdk/client-s3";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
import { PrismaClient } from '@prisma/client';
import "dotenv/config";
import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { authMiddleware } from '../middleware.js';


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


router.get("/presignedUrl", authMiddleware, async (req,res) => { 
    const userId = req.userId;

    const { url, fields } = await createPresignedPost(s3Client, {
        Bucket: 'task-to-reward',
        Key: `thumbnails/${userId}/${Math.random()}/image.jpg`,
        Conditions: [
          ['content-length-range', 0, 5 * 1024 * 1024] // 5 MB max
        ],
        Fields: {
            success_action_status: '201',
            'Content-Type': 'image/jpeg'
        },
        Expires: 3600
    })

    console.log(url, fields)

    res.json({
        preSignedUrl: url,
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

