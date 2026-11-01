import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { ApiError, api } from "@/lib/backend";
import { errorResponse } from "@/lib/http";
import { resetSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const body = resetSchema.parse(await request.json());
    const tokenHash = crypto.createHash("sha256").update(body.token).digest("hex");
    await api("/auth/reset", { body: { tokenHash, password: body.password } });
    return NextResponse.json({ message: "Password updated. You can sign in." });
  } catch (error) {
    if (error instanceof ApiError) return NextResponse.json({ error: error.message }, { status: error.status });
    return errorResponse(error);
  }
}
