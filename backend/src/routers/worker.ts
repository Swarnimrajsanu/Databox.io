import { PrismaClient } from '@prisma/client';
import "dotenv/config";
import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { worker } from 'node:cluster';
import user from './user.js';

const JWT_SECRET = "billubadmosh"
const router = Router();

export const WORKER_JWT_SECRET = JWT_SECRET + "worker";
const prisma = new PrismaClient({});


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