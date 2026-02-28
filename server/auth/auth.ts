import { auth0 } from "@/lib/auth0";
import { prisma } from "@/server/prisma/client";
import { UserRole } from "@/generated/prisma/enums";
import { AppError } from "@/server/errors/app-error";

export type AuthSession = {
  userId: string;
  role: UserRole;
  email: string;
};

/**
 * Upserts the Auth0 user into our database and returns the local session.
 * The Auth0 `sub` is used as the User's primary key.
 */
async function syncUser(
  sub: string,
  email: string,
  name?: string | null,
): Promise<AuthSession> {
  const user = await prisma.user.upsert({
    where: { id: sub },
    create: { id: sub, email, name: name ?? null },
    update: { email },
    select: { id: true, role: true, email: true },
  });
  return { userId: user.id, role: user.role, email: user.email };
}

// The _request parameter is kept so existing controllers compile without changes.
export async function getOptionalSession(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _request?: unknown,
): Promise<AuthSession | null> {
  const session = await auth0.getSession();
  if (!session?.user?.sub) return null;
  return syncUser(session.user.sub, session.user.email ?? "", session.user.name);
}

export async function requireAuth(_request?: unknown): Promise<AuthSession> {
  const session = await getOptionalSession();
  if (!session) throw new AppError("Authentication required.", 401, "UNAUTHORIZED");
  return session;
}

export async function requireAdmin(_request?: unknown): Promise<AuthSession> {
  const session = await requireAuth();
  if (session.role !== UserRole.ADMIN)
    throw new AppError("Admin role required.", 403, "FORBIDDEN");
  return session;
}
