import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { OrderError } from "@/lib/place-order";

function asOrderError(error: unknown): OrderError | null {
  let current: unknown = error;
  for (let depth = 0; depth < 6 && current; depth += 1) {
    if (current instanceof OrderError) return current;
    if (typeof current === "object" && current && "cause" in current) {
      current = (current as { cause?: unknown }).cause;
      continue;
    }
    break;
  }
  return null;
}

export function errorResponse(error: unknown) {
  if (error instanceof ZodError) {
    return NextResponse.json({ error: error.issues[0]?.message || "Check the form and try again." }, { status: 400 });
  }
  const orderError = asOrderError(error);
  if (orderError) {
    return NextResponse.json({ error: orderError.message }, { status: orderError.status });
  }
  const status = typeof error === "object" && error && "status" in error ? Number((error as { status?: number }).status) : 500;
  if (!status || status >= 500) {
    console.error(error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
  const message = error instanceof Error ? error.message : "Request could not be completed.";
  return NextResponse.json({ error: message }, { status });
}
