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

function validRating(n: unknown): n is number {
  return typeof n === "number" && Number.isInteger(n) && n >= 1 && n <= 5;
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
    const { title, author, genre, status, rating } = body;
    if (!title?.trim() || !author?.trim() || !genre?.trim()) {
      return NextResponse.json(
        { error: "Title, author, and genre are required" },
        { status: 400 }
      );
    }
    if (!["read", "want_to_read"].includes(status)) {
      return NextResponse.json(
        { error: "Status must be 'read' or 'want_to_read'" },
        { status: 400 }
      );
    }
    if (rating !== undefined && rating !== null && !validRating(rating)) {
      return NextResponse.json(
        { error: "Rating must be an integer from 1 to 5" },
        { status: 400 }
      );
    }
    const book = await prisma.book.create({
      data: {
        title: title.trim(),
        author: author.trim(),
        genre: genre.trim(),
        status,
        addedBy: session.user.name,
        ...(rating !== undefined && rating !== null && validRating(rating)
          ? { rating }
          : {}),
      },
    });
    return NextResponse.json(book);
  } catch (e) {
    return NextResponse.json(
      { error: "Failed to add book" },
      { status: 500 }
    );
  }
}
