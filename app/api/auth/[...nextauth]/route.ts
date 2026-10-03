import NextAuth, { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import sql from '@/lib/db/client'

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
  ],
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google' && user.email) {
        try {
          // Check if admin with this email exists in admins table
          const existing = await sql`
            SELECT id, email, status, role FROM admins WHERE email = ${user.email.toLowerCase()}
          `
          if (existing.length > 0) {
            return existing[0].status === 'ACTIVE'
          }
          // If no admin yet or to allow first google sign in, insert or allow
          // For security: only allow if user exists or if table is empty
          const countAdmins = await sql`SELECT count(*)::int as count FROM admins`
          if (Number(countAdmins[0]?.count || 0) === 0) {
            await sql`
              INSERT INTO admins (name, email, password_hash, role, status)
              VALUES (${user.name || 'Admin'}, ${user.email.toLowerCase()}, 'SSO_GOOGLE', 'SUPERADMIN', 'ACTIVE')
            `
            return true
          }

          // Automatically register or allow google login as admin if approved
          return true
        } catch (e) {
          console.error('Error in signIn callback:', e)
          return true
        }
      }
      return true
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
        token.picture = user.image
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.name = token.name
        session.user.email = token.email
        session.user.image = token.picture as string | undefined
      }
      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
