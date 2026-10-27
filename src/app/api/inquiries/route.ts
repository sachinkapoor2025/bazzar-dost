import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { errorResponse } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { cleanText } from "@/lib/format";
import { contactSchema, wholesaleSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const json = (await request.json()) as { type?: string };
    if (!rateLimit("inquiry", 30, 60 * 60 * 1000)) return NextResponse.json({ error: "Too many messages. Try again later." }, { status: 429 });
    if (json.type === "wholesale") {
      const body = wholesaleSchema.parse(json);
      await prisma.inquiry.create({
        data: {
          type: "wholesale",
          name: cleanText(body.name, 80),
          business: cleanText(body.business, 120),
          email: body.email.toLowerCase(),
          phone: body.phone,
          city: cleanText(body.city, 80),
          productInterest: cleanText(body.productInterest, 200),
          quantity: cleanText(body.quantity, 40),
          message: cleanText(body.message, 2000),
        },
      });
      return NextResponse.json({ message: "Enquiry saved. The store will review it. This did not create an order or reserve stock." });
    }
    const body = contactSchema.parse(json);
    await prisma.inquiry.create({
      data: {
        type: "contact",
        name: cleanText(body.name, 80),
        email: body.email.toLowerCase(),
        phone: body.phone,
        subject: cleanText(body.subject, 120),
        message: cleanText(body.message, 2000),
      },
    });
    return NextResponse.json({ message: "Message saved. The store team can read it in the admin inbox." });
  } catch (error) {
    return errorResponse(error);
  }
}
