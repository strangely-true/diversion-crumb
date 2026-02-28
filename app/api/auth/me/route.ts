import { NextRequest } from "next/server";
import { AuthController } from "@/server/controllers/auth.controller";

export async function GET(request: NextRequest) {
  return AuthController.me(request);
}
