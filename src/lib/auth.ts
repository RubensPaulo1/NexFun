import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import { PrismaAdapter } from '@auth/prisma-adapter'
import bcrypt from 'bcryptjs'
import prisma from './prisma'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/login',
    signOut: '/logout',
    error: '/login',
    verifyRequest: '/verify-email',
    newUser: '/onboarding',
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email e senha são obrigatórios')
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
        })

        if (!user || !user.password) {
          throw new Error('Credenciais inválidas')
        }

        const isValid = await bcrypt.compare(credentials.password, user.password)

        if (!isValid) {
          throw new Error('Credenciais inválidas')
        }

        if (!user.isActive) {
          throw new Error('Conta desativada')
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          avatar: user.avatar,
        }
      },
    }),
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
        token.avatar = (user as any).avatar
      }

      // Handle session updates
      if (trigger === 'update' && session) {
        token.name = session.name
        token.avatar = session.avatar
      }

      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.avatar = token.avatar as string | null
      }
      return session
    },
    async signIn({ user, account }) {
      // Allow OAuth sign in
      if (account?.provider === 'google') {
        return true
      }

      // Check if user is active for credentials
      if (account?.provider === 'credentials') {
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
        })
        return dbUser?.isActive ?? false
      }

      return true
    },
  },
  events: {
    async signIn({ user, isNewUser }) {
      if (isNewUser) {
        try {
          // Log new user registration
          await prisma.auditLog.create({
            data: {
              userId: user.id,
              action: 'USER_REGISTERED',
              entity: 'User',
              entityId: user.id,
              metadata: JSON.stringify({ method: 'oauth' }),
            },
          })
        } catch (error) {
          console.error('Error creating audit log:', error)
        }
      }
    },
  },
  debug: process.env.NODE_ENV === 'development',
}

// Utility functions for password hashing
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}
