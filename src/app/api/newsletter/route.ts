import { NextResponse } from "next/server";
import { api } from "@/lib/backend";
import { errorResponse } from "@/lib/http";
import { newsletterSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const body = newsletterSchema.parse(await request.json());
    const result = await api<{ created: boolean }>("/newsletter", { body: { email: body.email.toLowerCase() } });
    if (!result.created) return NextResponse.json({ message: "This email is already on the list." });
    return NextResponse.json({ message: "You're on the list. The store can use this address for BazaarDost updates." });
  } catch (error) {
    return errorResponse(error);
  }
}
