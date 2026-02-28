import { SignJWT, jwtVerify } from "jose";
import { UserRole } from "@/generated/prisma/enums";
import { AppError } from "@/server/errors/app-error";

export type AuthTokenPayload = {
  sub: string;
  email: string;
  role: UserRole;
};

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new AppError("Missing JWT_SECRET environment variable.", 500, "JWT_SECRET_MISSING");
  }
  return new TextEncoder().encode(secret);
}

export async function signAuthToken(payload: AuthTokenPayload) {
  return new SignJWT({ email: payload.email, role: payload.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());
}

export async function verifyAuthToken(token: string): Promise<AuthTokenPayload> {
  try {
    const { payload } = await jwtVerify(token, getSecret());

    const sub = payload.sub;
    const email = payload.email;
    const role = payload.role;

    if (!sub || typeof sub !== "string") {
      throw new AppError("Invalid auth token subject.", 401, "INVALID_TOKEN");
    }

    if (!email || typeof email !== "string") {
      throw new AppError("Invalid auth token email.", 401, "INVALID_TOKEN");
    }

    if (role !== UserRole.ADMIN && role !== UserRole.CUSTOMER) {
      throw new AppError("Invalid auth token role.", 401, "INVALID_TOKEN");
    }

    return {
      sub,
      email,
      role,
    };
  } catch {
    throw new AppError("Invalid or expired token.", 401, "INVALID_TOKEN");
  }
}
