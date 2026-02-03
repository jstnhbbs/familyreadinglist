import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth-server";

/** Accepts 0.5 to 5 in 0.5 steps (half-star ratings). */
function validRating(n: unknown): n is number {
  if (typeof n !== "number" || !Number.isFinite(n)) return false;
  const r = Math.round(n * 2) / 2;
  return r >= 0.5 && r <= 5;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: bookId } = await params;
  try {
    const reviews = await prisma.bookReview.findMany({
      where: { bookId, NOT: { hidden: true } },
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
    const { rating, notes, hidden } = body;

    if (hidden === true || hidden === false) {
      const review = await prisma.bookReview.upsert({
        where: {
          userId_bookId: { userId: session.user.id, bookId },
        },
        create: {
          userId: session.user.id,
          bookId,
          rating: null,
          notes: null,
          hidden,
        },
        update: { hidden },
        include: { user: { select: { id: true, name: true } } },
      });
      return NextResponse.json(review);
    }

    if (rating !== undefined && rating !== null && !validRating(rating)) {
      return NextResponse.json(
        { error: "Rating must be from 0.5 to 5 in half-star steps" },
        { status: 400 }
      );
    }
    const notesStr =
      notes !== undefined && notes !== null ? String(notes).trim() : null;
    const normalizedRating =
      rating !== undefined && rating !== null
        ? Math.round(rating * 2) / 2
        : null;
    const review = await prisma.bookReview.upsert({
      where: {
        userId_bookId: { userId: session.user.id, bookId },
      },
      create: {
        userId: session.user.id,
        bookId,
        rating: normalizedRating,
        notes: notesStr || null,
        hidden: false,
      },
      update: {
        ...(rating !== undefined ? { rating: normalizedRating } : {}),
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
