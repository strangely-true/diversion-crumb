import { auth0 } from "@/lib/auth0";
import { NextRequest, NextResponse } from "next/server";

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

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // 1. Handle CORS preflight for API routes before any other processing.
  if (pathname.startsWith("/api") && request.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 204,
      headers: buildCorsHeaders(request),
    });
  }

  // 2. Let the Auth0 SDK handle the request.
  //    It intercepts /auth/login, /auth/logout, /auth/callback, /auth/profile,
  //    /auth/access-token, and /auth/backchannel-logout automatically.
  //    All other routes are forwarded unchanged.
  const authResponse = await auth0.middleware(request);

  // 4. Attach CORS headers to API responses.
  if (pathname.startsWith("/api")) {
    buildCorsHeaders(request).forEach((value, key) =>
      authResponse.headers.set(key, value)
    );
  }

  return authResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
