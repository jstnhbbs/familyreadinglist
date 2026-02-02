import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth-server";

function validRating(n: unknown): n is number {
  return typeof n === "number" && Number.isInteger(n) && n >= 1 && n <= 5;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: bookId } = await params;
  try {
    const reviews = await prisma.bookReview.findMany({
      where: { bookId },
      include: { user: { select: { id: true, name: true } } },
      orderBy: { updatedAt: "desc" },
    });
    return NextResponse.json(reviews);
  } catch (e) {
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "You must be signed in to add or update a review" },
      { status: 401 }
    );
  }
  const { id: bookId } = await params;
  try {
    const body = await request.json();
    const { rating, notes } = body;
    if (rating !== undefined && rating !== null && !validRating(rating)) {
      return NextResponse.json(
        { error: "Rating must be an integer from 1 to 5" },
        { status: 400 }
      );
    }
    const notesStr =
      notes !== undefined && notes !== null ? String(notes).trim() : null;
    const review = await prisma.bookReview.upsert({
      where: {
        userId_bookId: { userId: session.user.id, bookId },
      },
      create: {
        userId: session.user.id,
        bookId,
        rating: rating ?? null,
        notes: notesStr || null,
      },
      update: {
        ...(rating !== undefined ? { rating: rating ?? null } : {}),
        ...(notes !== undefined ? { notes: notesStr || null } : {}),
      },
      include: { user: { select: { id: true, name: true } } },
    });
    return NextResponse.json(review);
  } catch (e) {
    return NextResponse.json(
      { error: "Failed to save review" },
      { status: 500 }
    );
  }
}
