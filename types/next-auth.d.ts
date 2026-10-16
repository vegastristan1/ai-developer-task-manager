import type { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      isAdmin: boolean;
    } & DefaultSession['user'];
  }
}

declare module '@auth/core/jwt' {
  interface JWT {
    id?: string;
    isAdmin?: boolean;
    /** Timestamp of the last "user still exists" check (throttled to once per hour). */
    v?: number;
  }
}
