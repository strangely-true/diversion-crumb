import { NextRequest, NextResponse } from "next/server";
import { withErrorHandling } from "@/server/errors/handle-error";
import { loginSchema, signupSchema } from "@/server/validation/auth.schemas";
import { AuthService } from "@/server/services/auth.service";
import { requireAuth } from "@/server/auth/auth";

const AUTH_COOKIE_NAME = "auth_token";

export class AuthController {
  static async signup(request: NextRequest) {
    return withErrorHandling(async () => {
      const payload = signupSchema.parse(await request.json());
      const data = await AuthService.signup(payload);
      const response = NextResponse.json(data, { status: 201 });
      response.cookies.set(AUTH_COOKIE_NAME, data.token, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });
      return response;
    });
  }

  static async login(request: NextRequest) {
    return withErrorHandling(async () => {
      const payload = loginSchema.parse(await request.json());
      const data = await AuthService.login(payload);
      const response = NextResponse.json(data);
      response.cookies.set(AUTH_COOKIE_NAME, data.token, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });
      return response;
    });
  }

  static async me(request: NextRequest) {
    return withErrorHandling(async () => {
      const session = await requireAuth(request);
      return NextResponse.json({
        user: {
          id: session.userId,
          role: session.role,
          email: session.email,
        },
      });
    });
  }

  static async logout() {
    return withErrorHandling(async () => {
      const response = NextResponse.json({ success: true });
      response.cookies.set(AUTH_COOKIE_NAME, "", {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 0,
      });
      return response;
    });
  }
}
