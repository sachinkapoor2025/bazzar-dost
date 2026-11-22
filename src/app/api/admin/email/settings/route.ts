import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { errorResponse } from "@/lib/http";
import { mailPublicStatus, saveMailSettings } from "@/lib/mail";

const schema = z.object({
  host: z.string().trim().min(1, "Enter the mail server host.").max(120).regex(/^[A-Za-z0-9.-]+$/, "The host can contain letters, numbers, dots, and hyphens."),
  port: z.coerce.number().int().min(1).max(65535),
  user: z.string().trim().max(120).optional().default(""),
  from: z.string().trim().email("Enter the sender email.").max(160),
  password: z.string().max(200).optional().default(""),
});

export async function GET() {
  try {
    await requireAdmin();
    return NextResponse.json(await mailPublicStatus());
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(request: Request) {
  try {
    await requireAdmin();
    const body = schema.parse(await request.json());
    await saveMailSettings({
      host: body.host,
      port: String(body.port),
      user: body.user,
      from: body.from,
      password: body.password,
    });
    return NextResponse.json({ ok: true, status: await mailPublicStatus() });
  } catch (error) {
    return errorResponse(error);
  }
}
