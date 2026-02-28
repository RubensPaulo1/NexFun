import 'next-auth'
import { UserRole } from '@prisma/client'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      role: string
      avatar?: string | null
    }
  }

  interface User {
    id: string
    email: string
    name?: string | null
    role: string
    avatar?: string | null
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: string
    avatar?: string | null
  }
}

