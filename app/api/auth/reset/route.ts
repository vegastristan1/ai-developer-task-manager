import { createHash } from 'node:crypto';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db/prisma';
import { readJsonBody } from '@/lib/security/body';
import { clientIp } from '@/lib/security/rate-limit';
import { rateLimitResponse } from '@/lib/security/responses';
import { resetPasswordSchema } from '@/lib/validations/auth';

const RESET_WINDOW_MS = 60 * 60 * 1000;
const RESET_LIMIT_PER_IP = 20;
const RESET_MAX_BODY_BYTES = 10 * 1024;

export async function POST(request: Request) {
  const limited = rateLimitResponse(
    `reset:${clientIp(request)}`,
    RESET_LIMIT_PER_IP,
    RESET_WINDOW_MS,
  );
  if (limited) return limited;

  const parsedBody = await readJsonBody(request, RESET_MAX_BODY_BYTES);
  if (!parsedBody.ok) return parsedBody.response;

  const parsed = resetPasswordSchema.safeParse(parsedBody.body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', issues: parsed.error.issues },
      { status: 422 },
    );
  }

  const tokenHash = createHash('sha256').update(parsed.data.token).digest('hex');
  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    select: { id: true, userId: true, expiresAt: true, usedAt: true },
  });

  if (!record || record.usedAt || record.expiresAt.getTime() <= Date.now()) {
    return NextResponse.json(
      { error: 'This reset link is invalid or has expired. Request a new one.' },
      { status: 400 },
    );
  }

  const passwordHash = await bcrypt.hash(parsed.data.newPassword, 12);
  await prisma.user.update({
    where: { id: record.userId },
    data: { passwordHash },
  });
  await prisma.passwordResetToken.update({
    where: { id: record.id },
    data: { usedAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
