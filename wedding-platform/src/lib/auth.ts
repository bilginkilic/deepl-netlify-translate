import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { UserRole } from "@prisma/client";

export async function getSession() {
  return getServerSession(authOptions);
}

export async function requireCouple() {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== UserRole.COUPLE) {
    return null;
  }
  return session;
}
