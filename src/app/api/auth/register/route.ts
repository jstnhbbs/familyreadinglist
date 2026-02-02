import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { email, name, password } = body ?? {};
    const emailTrim = typeof email === "string" ? email.trim().toLowerCase() : "";
    if (!emailTrim || !name?.trim() || !password) {
      return NextResponse.json(
        { error: "Email, name, and password are required" },
        { status: 400 }
      );
    }
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }
    if (typeof prisma.user === "undefined") {
      console.error("Prisma client missing User model. Run: npx prisma generate");
      return NextResponse.json(
        {
          error:
            "Server setup issue: run 'npx prisma generate' and restart the dev server.",
        },
        { status: 500 }
      );
    }
    const existing = await prisma.user.findUnique({
      where: { email: emailTrim },
    });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 400 }
      );
    }
    const passwordHash = await hash(String(password), 10);
    await prisma.user.create({
      data: {
        email: emailTrim,
        name: String(name).trim(),
        passwordHash,
      },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    console.error("Registration error:", e);
    return NextResponse.json(
      {
        error:
          process.env.NODE_ENV === "development"
            ? message
            : "Failed to create account",
      },
      { status: 500 }
    );
  }
}
