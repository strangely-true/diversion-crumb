import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const DEFAULT_ALLOWED_ORIGINS = ["http://localhost:3000"];

function getAllowedOrigins() {
  const configured = process.env.CORS_ALLOWED_ORIGINS;
  if (!configured) {
    return DEFAULT_ALLOWED_ORIGINS;
  }

  return configured
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function buildCorsHeaders(request: NextRequest) {
  const origin = request.headers.get("origin") ?? "";
  const allowedOrigins = getAllowedOrigins();
  const isAllowed = allowedOrigins.includes(origin);

  const headers = new Headers();
  headers.set("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  headers.set("Access-Control-Allow-Credentials", "true");
  headers.set("Vary", "Origin");

  if (isAllowed) {
    headers.set("Access-Control-Allow-Origin", origin);
  }

  return headers;
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith("/api")) {
    const corsHeaders = buildCorsHeaders(request);

    if (request.method === "OPTIONS") {
      return new NextResponse(null, {
        status: 204,
        headers: corsHeaders,
      });
    }

    const response = NextResponse.next();
    corsHeaders.forEach((value, key) => {
      response.headers.set(key, value);
    });
    return response;
  }

  if (pathname.startsWith("/account") || pathname.startsWith("/admin")) {
    const token = request.cookies.get("auth_token")?.value;
    if (!token) {
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }

    const encodedSecret = new TextEncoder().encode(secret);

    return jwtVerify(token, encodedSecret)
      .then(({ payload }) => {
        const role = payload.role;
        if (pathname.startsWith("/admin") && role !== "ADMIN") {
          return NextResponse.redirect(new URL("/", request.url));
        }

        return NextResponse.next();
      })
      .catch(() => NextResponse.redirect(new URL("/auth/login", request.url)));
  }

  if (pathname.startsWith("/auth/")) {
    const token = request.cookies.get("auth_token")?.value;
    if (token) {
      return NextResponse.redirect(new URL("/account", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*", "/account/:path*", "/admin/:path*", "/auth/:path*"],
};
