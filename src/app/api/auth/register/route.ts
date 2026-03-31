import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getIp, rateLimiters } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const ip = getIp(request.headers);
  const { limited, retryAfterMinutes } = await checkRateLimit(rateLimiters.register, `register:${ip}`);

  if (limited) {
    return NextResponse.json(
      { error: `Too many attempts. Please try again in ${retryAfterMinutes} minute${retryAfterMinutes === 1 ? '' : 's'}.` },
      {
        status: 429,
        headers: { 'Retry-After': String(retryAfterMinutes * 60) },
      },
    );
  }

  const body = await request.json();
  const { name, email, password, confirmPassword } = body;

  if (!email || !password || !confirmPassword) {
    return NextResponse.json({ error: "All fields are required" }, { status: 400 });
  }

  if (password !== confirmPassword) {
    return NextResponse.json({ error: "Passwords do not match" }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters" },
      { status: 400 }
    );
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Email already in use" }, { status: 409 });
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  await prisma.user.create({
    data: { name: name ?? null, email, password: hashedPassword },
  });

  return NextResponse.json({ success: true }, { status: 201 });
}
