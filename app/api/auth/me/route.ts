import { NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import { prisma } from "@/server/prisma/client";

export async function GET() {
  const session = await auth0.getSession();
  if (!session?.user?.sub) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sub, email = "", name, picture } = session.user;

  const user = await prisma.user.upsert({
    where: { id: sub },
    create: { id: sub, email, name: name ?? null },
    update: { email },
    select: { id: true, email: true, name: true, role: true },
  });

  // Merge Auth0 picture (not stored in DB) into the response
  return NextResponse.json({ user: { ...user, picture: picture ?? null } });
}
