import { prisma } from "@/server/prisma/client";
import { AppError } from "@/server/errors/app-error";
import { loginSchema, signupSchema } from "@/server/validation/auth.schemas";
import { signAuthToken } from "@/server/auth/jwt";
import { hashPassword, isHashedPassword, verifyPassword } from "@/server/auth/password";
import { UserRole } from "@/generated/prisma/enums";

type LoginInput = ReturnType<typeof loginSchema.parse>;
type SignupInput = ReturnType<typeof signupSchema.parse>;

async function buildAuthResponse(user: { id: string; email: string; name: string | null; role: UserRole }) {
  const token = await signAuthToken({
    sub: user.id,
    email: user.email,
    role: user.role,
  });

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
  };
}

export class AuthService {
  static async signup(input: SignupInput) {
    const existingUser = await prisma.user.findUnique({
      where: {
        email: input.email,
      },
      select: { id: true },
    });

    if (existingUser) {
      throw new AppError("Email is already registered.", 409, "EMAIL_ALREADY_EXISTS");
    }

    const passwordHash = await hashPassword(input.password);
    const user = await prisma.user.create({
      data: {
        email: input.email,
        password: passwordHash,
        name: input.name,
      },
    });

    return buildAuthResponse(user);
  }

  static async login(input: LoginInput) {
    const user = await prisma.user.findUnique({
      where: {
        email: input.email,
      },
    });

    if (!user) {
      throw new AppError("Invalid email or password.", 401, "INVALID_CREDENTIALS");
    }

    let isValidPassword = false;

    if (isHashedPassword(user.password)) {
      isValidPassword = await verifyPassword(input.password, user.password);
    } else {
      isValidPassword = user.password === input.password;
      if (isValidPassword) {
        const upgradedHash = await hashPassword(input.password);
        await prisma.user.update({
          where: { id: user.id },
          data: { password: upgradedHash },
        });
      }
    }

    if (!isValidPassword) {
      throw new AppError("Invalid email or password.", 401, "INVALID_CREDENTIALS");
    }

    return buildAuthResponse(user);
  }
}
