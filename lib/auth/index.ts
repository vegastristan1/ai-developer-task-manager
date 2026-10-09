import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db/prisma';
import { loginSchema } from '@/lib/validations/auth';

const isProduction = process.env.NODE_ENV === 'production';
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

if (isProduction && (!process.env.AUTH_SECRET || process.env.AUTH_SECRET.length < 32)) {
  throw new Error('AUTH_SECRET must be set to at least 32 characters when running in production.');
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: 'jwt', maxAge: SESSION_MAX_AGE_SECONDS },
  cookies: {
    sessionToken: {
      options: {
        httpOnly: true,
        sameSite: 'lax',
        secure: isProduction,
        path: '/',
        maxAge: SESSION_MAX_AGE_SECONDS,
      },
    },
  },
  pages: {
    signIn: '/login',
  },
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      authorize: async (credentials) => {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
        });
        if (!user) return null;

        const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!valid) return null;

        return { id: user.id, email: user.email, name: user.name, image: user.image };
      },
    }),
  ],
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.id = user.id;
        token.picture = user.image ?? null;
        token.v = Date.now();
        return token;
      }
      // Verify the account still exists, but at most once per hour — doing this
      // on every request added a serial database round trip to each navigation.
      // The same query refreshes the display claims so profile renames propagate
      // without keeping a per-request database read.
      const CHECK_INTERVAL_MS = 60 * 60 * 1000;
      const lastChecked = typeof token.v === 'number' ? token.v : 0;
      if (typeof token.id === 'string' && Date.now() - lastChecked > CHECK_INTERVAL_MS) {
        const account = await prisma.user.findUnique({
          where: { id: token.id },
          select: { id: true, name: true, image: true },
        });
        if (!account) {
          return null;
        }
        token.name = account.name;
        token.picture = account.image ?? null;
        token.v = Date.now();
      }
      return token;
    },
    session({ session, token }) {
      if (session.user && typeof token.id === 'string') {
        session.user.id = token.id;
        session.user.name = typeof token.name === 'string' ? token.name : null;
        if (typeof token.email === 'string') {
          session.user.email = token.email;
        }
        session.user.image = typeof token.picture === 'string' ? token.picture : null;
      }
      return session;
    },
  },
});
