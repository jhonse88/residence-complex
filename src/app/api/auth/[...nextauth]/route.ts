import prisma from "@/app/lib/prisma";
import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken'
import { JWT } from "next-auth/jwt";


export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: 'credentials',
            credentials: {
                email: { label: 'Email', type: 'text' },
                password: { label: 'Password', type: 'password' }
            },
            authorize: async (credentials) => {
                if(!credentials) return null;

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email }
                });

                if(!user) return null;

                const isValidPassword = bcrypt.compareSync(
                    credentials.password, 
                    user.passwordHash
                );

                if(!isValidPassword) return null;

                return {
                    id: user.id.toString(),
                    email: user.email
                };
            }
        })
    ],
    pages: {
        signIn: '/auth/signin',
        signOut: '/auth/signout',
    },
    secret: process.env.NEXTAUTH_SECRET,
    jwt: {
        encode: ({ secret, token }) => {
            if(!token) throw new Error('No token to encode');
            return jwt.sign(token, secret);
        },
        decode: async ({ secret, token }) => {
            if(!token) return null;
            try {
                return jwt.verify(token, secret) as JWT;
            } catch {
                return null;
            }
        }
    },
    session: {
        strategy: 'jwt',
        maxAge: 30 * 24 * 60 * 60,
    },
    callbacks: {
        async session({ session, token }) {
            if(session.user) {
                session.user.email = token.email;
            }
            return session;
        },
        async jwt({ token, user }) {
            if(user) {
                token.email = user.email;
            }
            return token;
        }
    }
}

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };