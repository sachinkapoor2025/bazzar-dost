import { NextResponse } from "next/server";
import { api } from "@/lib/backend";
import { requireUser } from "@/lib/auth";
import { errorResponse } from "@/lib/http";
import { profileSchema } from "@/lib/validators";

export async function PATCH(request: Request) {
  try {
    await requireUser();
    const body = profileSchema.parse(await request.json());
    await api("/account/profile", { method: "PATCH", body });
    return NextResponse.json({ message: "Profile saved." });
  } catch (error) {
    return errorResponse(error);
  }
}
