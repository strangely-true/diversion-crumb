import { NextRequest } from "next/server";
import { UserRole } from "@/generated/prisma/enums";
import { AppError } from "@/server/errors/app-error";
import { verifyAuthToken } from "@/server/auth/jwt";

export type AuthSession = {
  userId: string;
  role: UserRole;
  email?: string;
};

function getBearerToken(request: NextRequest) {
  const authHeader = request.headers.get("authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) {
    return null;
  }

  return authHeader.replace("Bearer ", "").trim();
}

export async function getOptionalSession(request: NextRequest): Promise<AuthSession | null> {
  const bearerToken = getBearerToken(request);
  const cookieToken = request.cookies.get("auth_token")?.value;
  const token = bearerToken || cookieToken;

  if (token) {
    const payload = await verifyAuthToken(token);
    return {
      userId: payload.sub,
      role: payload.role,
      email: payload.email,
    };
  }

  return null;
}

export async function requireAuth(request: NextRequest): Promise<AuthSession> {
  const session = await getOptionalSession(request);

  if (!session) {
    throw new AppError("Authentication required.", 401, "UNAUTHORIZED");
  }

  return session;
}

export async function requireAdmin(request: NextRequest): Promise<AuthSession> {
  const session = await requireAuth(request);

  if (session.role !== UserRole.ADMIN) {
    throw new AppError("Admin role required.", 403, "FORBIDDEN");
  }

  return session;
}
