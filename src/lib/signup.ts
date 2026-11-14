import "server-only";
import { hashPassword } from "@/lib/auth";
import { prisma, databaseConfigured, isUniqueConstraint } from "@/lib/db";
import { roleForEmail } from "@/lib/staff";

export type SignupFailure = { ok: false; status: number; error: string };
export type SignupSuccess = { ok: true; userId: string; role: string; message: string };

const DATABASE_OFF = "The account database is not configured, so registration cannot be completed.";
const DUPLICATE = "An account with this email already exists.";

export async function registerCustomer(input: {
  name: string;
  email: string;
  phone: string;
  password: string;
}): Promise<SignupSuccess | SignupFailure> {
  if (!databaseConfigured()) return { ok: false, status: 503, error: DATABASE_OFF };

  const email = input.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) return { ok: false, status: 400, error: DUPLICATE };

  const passwordHash = await hashPassword(input.password);
  try {
    const user = await prisma.user.create({
      data: {
        email,
        name: input.name,
        phone: input.phone,
        passwordHash,
        role: roleForEmail(email),
      },
    });
    return { ok: true, userId: user.id, role: user.role, message: "Your account is ready." };
  } catch (error) {
    if (isUniqueConstraint(error)) return { ok: false, status: 400, error: DUPLICATE };
    throw error;
  }
}
