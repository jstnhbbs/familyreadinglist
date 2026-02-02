import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

function validRating(n: unknown): n is number {
  return typeof n === "number" && Number.isInteger(n) && n >= 1 && n <= 5;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();
    const { rating } = body;

    if (rating !== undefined && rating !== null) {
      if (!validRating(rating)) {
        return NextResponse.json(
          { error: "Rating must be an integer from 1 to 5" },
          { status: 400 }
        );
      }
    }

    const book = await prisma.book.update({
      where: { id },
      data: rating !== undefined && rating !== null ? { rating } : {},
    });
    return NextResponse.json(book);
  } catch (e) {
    return NextResponse.json(
      { error: "Failed to update book" },
      { status: 500 }
    );
  }
}
