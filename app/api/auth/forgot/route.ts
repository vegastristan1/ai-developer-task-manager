import { createHash, randomBytes } from 'node:crypto';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { sendPasswordResetEmail } from '@/lib/email/sender';
import { readJsonBody } from '@/lib/security/body';
import { clientIp } from '@/lib/security/rate-limit';
import { rateLimitResponse } from '@/lib/security/responses';
import { forgotPasswordSchema } from '@/lib/validations/auth';

const FORGOT_WINDOW_MS = 60 * 60 * 1000;
const FORGOT_LIMIT_PER_IP = 20;
const FORGOT_MAX_BODY_BYTES = 2 * 1024;
const TOKEN_TTL_MS = 60 * 60 * 1000;

function appOrigin(request: Request): string {
  const configured = process.env['NEXT_PUBLIC_APP_URL']?.trim();
  if (configured) return configured.replace(/\/+$/, '');
  return new URL(request.url).origin;
}

export async function POST(request: Request) {
  const limited = rateLimitResponse(
    `forgot:${clientIp(request)}`,
    FORGOT_LIMIT_PER_IP,
    FORGOT_WINDOW_MS,
  );
  if (limited) return limited;

  const parsedBody = await readJsonBody(request, FORGOT_MAX_BODY_BYTES);
  if (!parsedBody.ok) return parsedBody.response;

  const parsed = forgotPasswordSchema.safeParse(parsedBody.body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', issues: parsed.error.issues },
      { status: 422 },
    );
  }

  const email = parsed.data.email.trim().toLowerCase();
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true },
  });

  // Always respond 200 so attackers cannot enumerate registered emails.
  if (user) {
    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id, usedAt: null },
    });
    const token = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(token).digest('hex');
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
      },
    });
    await sendPasswordResetEmail({
      to: user.email,
      resetUrl: `${appOrigin(request)}/reset-password/${token}`,
    });
  }

  return NextResponse.json({
    ok: true,
    message: 'If an account exists for that email, a reset link is on its way.',
  });
}
