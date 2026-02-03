import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth-server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const genre = searchParams.get("genre");
  try {
    const books = await prisma.book.findMany({
      orderBy: { createdAt: "desc" },
      where: genre && genre !== "all" ? { genre } : undefined,
      include: {
        reviews: {
          where: { hidden: false },
          include: { user: { select: { id: true, name: true } } },
        },
      },
    });
    return NextResponse.json(books);
  } catch (e) {
    return NextResponse.json(
      { error: "Failed to fetch books" },
      { status: 500 }
    );
  }
}

/** Accepts 0.5 to 5 in 0.5 steps (half-star ratings). */
function validRating(n: unknown): n is number {
  if (typeof n !== "number" || !Number.isFinite(n)) return false;
  const r = Math.round(n * 2) / 2;
  return r >= 0.5 && r <= 5;
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "You must be signed in to add a book" },
      { status: 401 }
    );
  }
  try {
    const body = await request.json();
    const { title, author, genre, status, rating, notes } = body;
    if (!title?.trim() || !author?.trim() || !genre?.trim()) {
      return NextResponse.json(
        { error: "Title, author, and genre are required" },
        { status: 400 }
      );
    }
    const validStatuses = ["read", "want_to_read", "currently_reading"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Status must be 'read', 'want_to_read', or 'currently_reading'" },
        { status: 400 }
      );
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
      rating !== undefined && rating !== null && validRating(rating)
        ? Math.round(rating * 2) / 2
        : null;
    const book = await prisma.book.create({
      data: {
        title: title.trim(),
        author: author.trim(),
        genre: genre.trim(),
        status,
        addedBy: session.user.name,
        ...(normalizedRating != null ? { rating: normalizedRating } : {}),
      },
    });
    const hasReview = normalizedRating != null || (notesStr && notesStr.length > 0);
    if (hasReview) {
      await prisma.bookReview.create({
        data: {
          userId: session.user.id,
          bookId: book.id,
          rating: normalizedRating,
          notes: notesStr || null,
        },
      });
    }
    const bookWithReviews = await prisma.book.findUnique({
      where: { id: book.id },
      include: {
        reviews: {
          where: { hidden: false },
          include: { user: { select: { id: true, name: true } } },
        },
      },
    });
    return NextResponse.json(bookWithReviews ?? book);
  } catch (e) {
    return NextResponse.json(
      { error: "Failed to add book" },
      { status: 500 }
    );
  }
}
