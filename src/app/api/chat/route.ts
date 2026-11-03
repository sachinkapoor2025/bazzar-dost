import { NextResponse } from "next/server";
import { answerQuestion } from "@/lib/chat";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (!rateLimit(`chat:${forwarded}`, 30, 60_000)) {
    return NextResponse.json({ error: "Too many messages. Please try again in a minute." }, { status: 429 });
  }
  let message = "";
  try {
    const body = (await request.json()) as { message?: unknown };
    message = typeof body.message === "string" ? body.message : "";
  } catch {
    return NextResponse.json({ error: "Please type a question." }, { status: 400 });
  }
  if (message.trim().length < 2) {
    return NextResponse.json({ error: "Please type a question." }, { status: 400 });
  }
  const answer = await answerQuestion(message);
  return NextResponse.json(answer);
}
