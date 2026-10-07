import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';

const PROJECT_DETAIL_PATTERN = /^\/projects\/([^/]+)(\/edit)?$/;
const CUID_PATTERN = /^c[a-z0-9]{20,30}$/;

function projectNotFound(request: NextRequest) {
  return NextResponse.rewrite(new URL('/__not_found__', request.url));
}

export default auth(async (req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth?.user;
  const isAuthPage = pathname === '/login' || pathname === '/register';

  if (isLoggedIn && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  if (!isLoggedIn && !isAuthPage) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  const match = PROJECT_DETAIL_PATTERN.exec(pathname);
  const userId = req.auth?.user?.id;
  const projectId = match?.[1] ? decodeURIComponent(match[1]) : null;

  if (userId && projectId && projectId !== 'new') {
    if (!CUID_PATTERN.test(projectId)) {
      return projectNotFound(req);
    }

    const project = await prisma.project.findFirst({
      where: { id: projectId, userId },
      select: { id: true },
    });

    if (!project) {
      return projectNotFound(req);
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
