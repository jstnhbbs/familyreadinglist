import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth-server";

const VALID_STATUSES = ["read", "want_to_read", "currently_reading"] as const;

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "You must be signed in to edit a book" },
      { status: 401 }
    );
  }

  const { id } = await params;
  try {
    const book = await prisma.book.findUnique({ where: { id } });
    if (!book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }
    if (book.addedBy !== session.user.name) {
      return NextResponse.json(
        { error: "Only the person who added this book can edit it" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, author, genre, status } = body;

    const data: { title?: string; author?: string; genre?: string; status?: string } = {};
    if (title !== undefined) data.title = String(title).trim();
    if (author !== undefined) data.author = String(author).trim();
    if (genre !== undefined) data.genre = String(genre).trim();
    if (status !== undefined) {
      if (!VALID_STATUSES.includes(status)) {
        return NextResponse.json(
          { error: "Status must be 'read', 'want_to_read', or 'currently_reading'" },
          { status: 400 }
        );
      }
      data.status = status;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(book);
    }

    const updated = await prisma.book.update({
      where: { id },
      data,
      include: {
        reviews: {
          include: { user: { select: { id: true, name: true } } },
        },
      },
    });
    return NextResponse.json(updated);
  } catch (e) {
    return NextResponse.json(
      { error: "Failed to update book" },
      { status: 500 }
    );
  }
}
