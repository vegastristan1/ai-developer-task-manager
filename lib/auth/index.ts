import NextAuth, { CredentialsSignin } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db/prisma';
import { loginSchema } from '@/lib/validations/auth';
import { isBootstrapAdmin } from '@/lib/auth/bootstrap';

class PendingApprovalError extends CredentialsSignin {
  code = 'pending_approval';
}

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

        if (!user.approved) {
          // Bootstrap admins never need manual approval. Self-heal accounts
          // that were registered before this exemption existed.
          if (isBootstrapAdmin(user.email)) {
            const promoted = await prisma.user.update({
              where: { id: user.id },
              data: {
                approved: true,
                approvedAt: user.approvedAt ?? new Date(),
                isAdmin: true,
              },
            });
            return {
              id: promoted.id,
              email: promoted.email,
              name: promoted.name,
              image: promoted.image,
              isAdmin: true,
            };
          }
          throw new PendingApprovalError();
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          isAdmin: user.isAdmin,
          tokenVersion: user.tokenVersion,
        };
      },
    }),
  ],
  callbacks: {
    jwt: async ({ token, user, trigger }) => {
      if (user) {
        token.id = user.id;
        token.isAdmin = (user as { isAdmin?: boolean }).isAdmin === true;
        token.picture = user.image ?? null;
        token.tv = (user as { tokenVersion?: number }).tokenVersion ?? 0;
        token.v = Date.now();
        token.vv = Date.now();
        return token;
      }
      if (typeof token.id !== 'string') return token;
      // Explicit session refresh (e.g. right after "sign out everywhere"):
      // re-sync claims and the session version immediately.
      if (trigger === 'update') {
        const account = await prisma.user.findUnique({
          where: { id: token.id },
          select: {
            id: true,
            name: true,
            image: true,
            approved: true,
            isAdmin: true,
            tokenVersion: true,
          },
        });
        if (!account || !account.approved) {
          return null;
        }
        token.name = account.name;
        token.picture = account.image ?? null;
        token.isAdmin = account.isAdmin;
        token.tv = account.tokenVersion;
        token.v = Date.now();
        token.vv = Date.now();
        return token;
      }
      // Enforce "sign out everywhere": a cheap indexed lookup, at most once
      // per minute, so revoked sessions die quickly without a database read
      // on every request.
      const VERSION_CHECK_INTERVAL_MS = 60 * 1000;
      const lastVersionChecked = typeof token.vv === 'number' ? token.vv : 0;
      if (Date.now() - lastVersionChecked > VERSION_CHECK_INTERVAL_MS) {
        const version = await prisma.user.findUnique({
          where: { id: token.id },
          select: { tokenVersion: true },
        });
        if (!version || version.tokenVersion !== (token.tv ?? 0)) {
          return null;
        }
        token.vv = Date.now();
      }
      // Verify the account still exists (and is still approved), but at most
      // once per hour — doing this on every request added a serial database
      // round trip to each navigation. The same query refreshes the display
      // claims so profile renames propagate without keeping a per-request
      // database read.
      const CHECK_INTERVAL_MS = 60 * 60 * 1000;
      const lastChecked = typeof token.v === 'number' ? token.v : 0;
      if (typeof token.id === 'string' && Date.now() - lastChecked > CHECK_INTERVAL_MS) {
        const account = await prisma.user.findUnique({
          where: { id: token.id },
          select: { id: true, name: true, image: true, approved: true, isAdmin: true },
        });
        if (!account || !account.approved) {
          return null;
        }
        token.name = account.name;
        token.picture = account.image ?? null;
        token.isAdmin = account.isAdmin;
        token.v = Date.now();
      }
      return token;
    },
    session({ session, token }) {
      if (session.user && typeof token.id === 'string') {
        session.user.id = token.id;
        session.user.isAdmin = token.isAdmin === true;
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
