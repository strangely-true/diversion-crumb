import { AuthController } from "@/server/controllers/auth.controller";

export async function POST() {
  return AuthController.logout();
}
