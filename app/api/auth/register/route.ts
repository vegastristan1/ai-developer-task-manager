import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db/prisma';
import { readJsonBody } from '@/lib/security/body';
import { clientIp } from '@/lib/security/rate-limit';
import { rateLimitResponse } from '@/lib/security/responses';
import { registerSchema } from '@/lib/validations/auth';

const REGISTER_WINDOW_MS = 60 * 60 * 1000;
const REGISTER_LIMIT_PER_IP = 50;
const REGISTER_MAX_BODY_BYTES = 10 * 1024;

export async function POST(request: Request) {
  const limited = rateLimitResponse(
    `register:${clientIp(request)}`,
    REGISTER_LIMIT_PER_IP,
    REGISTER_WINDOW_MS,
  );
  if (limited) return limited;

  const parsedBody = await readJsonBody(request, REGISTER_MAX_BODY_BYTES);
  if (!parsedBody.ok) return parsedBody.response;

  const parsed = registerSchema.safeParse(parsedBody.body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', issues: parsed.error.issues },
      { status: 422 },
    );
  }

  const { name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: 'An account with this email already exists' },
      { status: 409 },
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { email, name, passwordHash },
  });

  return NextResponse.json(
    { user: { id: user.id, email: user.email, name: user.name } },
    { status: 201 },
  );
}
