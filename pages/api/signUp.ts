import { NextApiRequest, NextApiResponse } from 'next';
import prisma from "@/app/lib/prisma";
import bcrypt from 'bcryptjs';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { email, password } = req.body;

  // Validación básica
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    
    await prisma.user.create({
      data: { email, passwordHash }
    });

    return res.status(201).json({ message: 'User created successfully' });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
}