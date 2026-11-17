import { NextResponse } from "next/server";
import { updateAccountProfile } from "@/lib/account-store";
import { requireUser, setSessionCookie, signSession } from "@/lib/auth";
import { errorResponse } from "@/lib/http";
import { profileSchema } from "@/lib/validators";

export async function PATCH(request: Request) {
  try {
    const user = await requireUser();
    const body = profileSchema.parse(await request.json());
    const result = await updateAccountProfile(user.id, { name: body.name, phone: body.phone });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
    const token = await signSession(result.user);
    if (token) await setSessionCookie(token);
    return NextResponse.json({ message: "Profile saved." });
  } catch (error) {
    return errorResponse(error);
  }
}
