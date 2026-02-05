import { PrismaClient } from '@prisma/client';
import { Router } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = "your_jwt_secret_key"

const router = Router();

const prisma = new PrismaClient({});



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