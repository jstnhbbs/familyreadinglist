"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { StarRating } from "@/components/StarRating";
import { SignIn } from "@/components/SignIn";

type Review = {
  id: string;
  userId: string;
  bookId: string;
  rating: number | null;
  notes: string | null;
  user: { id: string; name: string };
};

type Book = {
  id: string;
  title: string;
  author: string;
  genre: string;
  status: string;
  rating: number | null;
  addedBy: string;
  createdAt: string;
  reviews: Review[];
};

const COMMON_GENRES = [
  "Fiction",
  "Nonfiction",
  "Mystery",
  "Sci-Fi",
  "Fantasy",
  "Romance",
  "Biography",
  "History",
  "Self-Help",
  "Young Adult",
  "Children's",
  "Other",
];

export default function Home() {
  const { data: session, status: sessionStatus } = useSession();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [genreFilter, setGenreFilter] = useState<string>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState({
    title: "",
    author: "",
    genre: "Fiction",
    status: "want_to_read",
    rating: null as number | null,
    notes: "",
  });
  const [savingReviewBookId, setSavingReviewBookId] = useState<string | null>(null);
  const [editingBookId, setEditingBookId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{
    title: string;
    author: string;
    genre: string;
    status: string;
    rating: number | null;
    notes: string;
  } | null>(null);
  const [savingEditBookId, setSavingEditBookId] = useState<string | null>(null);

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/books");
      if (res.ok) {
        const data = await res.json();
        setBooks(data);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  const genresFromBooks = Array.from(
    new Set(books.map((b) => b.genre).filter(Boolean))
  ).sort();
  const allGenres = Array.from(
    new Set([...COMMON_GENRES, ...genresFromBooks])
  ).sort();
  const filteredBooks =
    genreFilter === "all"
      ? books
      : books.filter((b) => b.genre === genreFilter);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          rating: form.rating ?? undefined,
          notes: form.notes.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || "Something went wrong");
        return;
      }
      setForm({
        title: "",
        author: "",
        genre: "Fiction",
        status: "want_to_read",
        rating: null,
        notes: "",
      });
      setFormOpen(false);
      await fetchBooks();
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveReview = async (
    bookId: string,
    updates: { rating?: number | null; notes?: string | null }
  ) => {
    setSavingReviewBookId(bookId);
    try {
      const res = await fetch(`/api/books/${bookId}/reviews`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        const review = await res.json();
        setBooks((prev) =>
          prev.map((b) => {
            if (b.id !== bookId) return b;
            const others = b.reviews.filter((r) => r.userId !== review.userId);
            return {
              ...b,
              reviews: [review, ...others],
            };
          })
        );
      } else await fetchBooks();
    } catch {
      await fetchBooks();
    } finally {
      setSavingReviewBookId(null);
    }
  };

  const handleHideReview = async (bookId: string) => {
    setSavingReviewBookId(bookId);
    try {
      const res = await fetch(`/api/books/${bookId}/reviews`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hidden: true }),
      });
      if (res.ok) await fetchBooks();
    } catch {
      await fetchBooks();
    } finally {
      setSavingReviewBookId(null);
    }
  };

  const getMyReview = (book: Book) =>
    session?.user?.id
      ? book.reviews.find((r) => r.user.id === session.user.id)
      : null;

  const handleStartEdit = (book: Book) => {
    const myReview = getMyReview(book);
    setEditingBookId(book.id);
    setEditForm({
      title: book.title,
      author: book.author,
      genre: book.genre,
      status: book.status,
      rating: myReview?.rating ?? null,
      notes: myReview?.notes ?? "",
    });
  };

  const handleCancelEdit = () => {
    setEditingBookId(null);
    setEditForm(null);
  };

  const handleSaveEdit = async (bookId: string) => {
    if (!editForm) return;
    setSavingEditBookId(bookId);
    try {
      const bookRes = await fetch(`/api/books/${bookId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editForm.title,
          author: editForm.author,
          genre: editForm.genre,
          status: editForm.status,
        }),
      });
      const reviewRes = await fetch(`/api/books/${bookId}/reviews`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating: editForm.rating ?? null,
          notes: editForm.notes.trim() || null,
        }),
      });
      if (bookRes.ok) {
        if (!reviewRes.ok) {
          const err = await reviewRes.json().catch(() => ({}));
          console.error("Review save failed:", err);
        }
        await fetchBooks();
        setEditingBookId(null);
        setEditForm(null);
      } else await fetchBooks();
    } catch {
      await fetchBooks();
    } finally {
      setSavingEditBookId(null);
    }
  };

  const statusLabel = (status: string) =>
    status === "read"
      ? "Read"
      : status === "currently_reading"
        ? "Currently reading"
        : "Want to read";

  if (sessionStatus === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-100 text-stone-500">
        Loading…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900">
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <header className="mb-10">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="font-serif text-4xl font-bold tracking-tight text-amber-900">
                Family Reading List
              </h1>
              <p className="mt-2 text-stone-600">
                Share what you&apos;ve read and what you want to read with the group.
              </p>
            </div>
            {session ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-stone-600">
                  Signed in as <strong>{session.user.name}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm text-stone-700 hover:bg-stone-50 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  Sign out
                </button>
              </div>
            ) : null}
          </div>
        </header>

        {!session && (
          <div className="mb-8">
            <SignIn />
            <p className="mt-4 text-sm text-stone-500">
              Sign in to add books and your own ratings and notes. You can still
              browse the list below.
            </p>
          </div>
        )}

        <div className="mb-6 flex flex-wrap items-center gap-3">
          <label className="text-sm font-medium text-stone-600">
            Filter by genre:
          </label>
          <select
            value={genreFilter}
            onChange={(e) => setGenreFilter(e.target.value)}
            className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-800 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
          >
            <option value="all">All genres</option>
            {allGenres.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
          {session && (
            <button
              type="button"
              onClick={() => setFormOpen(!formOpen)}
              className="ml-auto rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
            >
              {formOpen ? "Cancel" : "Add a book"}
            </button>
          )}
        </div>

        {session && formOpen && (
          <form
            onSubmit={handleSubmit}
            className="mb-8 rounded-xl border border-amber-200 bg-amber-50/80 p-6 shadow-sm"
          >
            <h2 className="mb-4 font-serif text-xl font-semibold text-amber-900">
              Add a book
            </h2>
            {formError && (
              <p className="mb-3 text-sm text-red-600">{formError}</p>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  className="w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-800 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  placeholder="e.g. The Great Gatsby"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">
                  Author *
                </label>
                <input
                  type="text"
                  required
                  value={form.author}
                  onChange={(e) => setForm((f) => ({ ...f, author: e.target.value }))}
                  className="w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-800 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  placeholder="e.g. F. Scott Fitzgerald"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">
                  Genre *
                </label>
                <select
                  value={form.genre}
                  onChange={(e) => setForm((f) => ({ ...f, genre: e.target.value }))}
                  className="w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-800 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  {COMMON_GENRES.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">
                  Status
                </label>
                <select
                  value={form.status}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      status: e.target.value,
                      ...(e.target.value === "want_to_read"
                        ? { rating: null, notes: "" }
                        : {}),
                    }))
                  }
                  className="w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-800 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  <option value="want_to_read">Want to read</option>
                  <option value="currently_reading">Currently reading</option>
                  <option value="read">Read</option>
                </select>
              </div>
              {(form.status === "read" || form.status === "currently_reading") && (
                <>
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-sm font-medium text-stone-700">
                      Your rating (optional)
                    </label>
                    <StarRating
                      value={form.rating}
                      onChange={(n) => setForm((f) => ({ ...f, rating: n }))}
                      readonly={false}
                      size="md"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-sm font-medium text-stone-700">
                      Your notes (optional)
                    </label>
                    <input
                      type="text"
                      value={form.notes}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, notes: e.target.value }))
                      }
                      className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-stone-800 placeholder:text-stone-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                      placeholder="e.g. Great summer read, would recommend"
                    />
                  </div>
                </>
              )}
            </div>
            <div className="mt-4">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-amber-700 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
              >
                {submitting ? "Adding…" : "Add to list"}
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <p className="text-stone-500">Loading…</p>
        ) : filteredBooks.length === 0 ? (
          <div className="rounded-xl border border-stone-200 bg-white p-8 text-center text-stone-500">
            {books.length === 0
              ? "No books yet. Sign in and add one to get started!"
              : `No books in "${genreFilter}". Try another genre or add one.`}
          </div>
        ) : (
          <ul className="space-y-3">
            {filteredBooks.map((book) => {
              const myReview = getMyReview(book);
              const otherReviews = book.reviews.filter(
                (r) => r.user.id !== session?.user?.id
              );
              return (
                <li
                  key={book.id}
                  className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
                >
                  {editingBookId === book.id && editForm ? (
                    <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-4">
                      <p className="mb-3 text-sm font-medium text-amber-900">
                        Edit book
                      </p>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <label className="mb-1 block text-xs font-medium text-stone-600">
                            Title
                          </label>
                          <input
                            type="text"
                            value={editForm.title}
                            onChange={(e) =>
                              setEditForm((f) => f && { ...f, title: e.target.value })
                            }
                            className="w-full rounded border border-stone-300 px-2 py-1.5 text-sm text-stone-800 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-medium text-stone-600">
                            Author
                          </label>
                          <input
                            type="text"
                            value={editForm.author}
                            onChange={(e) =>
                              setEditForm((f) => f && { ...f, author: e.target.value })
                            }
                            className="w-full rounded border border-stone-300 px-2 py-1.5 text-sm text-stone-800 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-medium text-stone-600">
                            Genre
                          </label>
                          <input
                            type="text"
                            value={editForm.genre}
                            onChange={(e) =>
                              setEditForm((f) => f && { ...f, genre: e.target.value })
                            }
                            className="w-full rounded border border-stone-300 px-2 py-1.5 text-sm text-stone-800 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-medium text-stone-600">
                            Status
                          </label>
                          <select
                            value={editForm.status}
                            onChange={(e) =>
                              setEditForm((f) => f && { ...f, status: e.target.value })
                            }
                            className="w-full rounded border border-stone-300 px-2 py-1.5 text-sm text-stone-800 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                          >
                            <option value="want_to_read">Want to read</option>
                            <option value="currently_reading">Currently reading</option>
                            <option value="read">Read</option>
                          </select>
                        </div>
                        <div className="sm:col-span-2">
                          <label className="mb-1 block text-xs font-medium text-stone-600">
                            Your rating
                          </label>
                          <StarRating
                            value={editForm.rating}
                            onChange={(n) =>
                              setEditForm((f) => f && { ...f, rating: n })
                            }
                            readonly={false}
                            size="md"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="mb-1 block text-xs font-medium text-stone-600">
                            Your notes
                          </label>
                          <input
                            type="text"
                            value={editForm.notes}
                            onChange={(e) =>
                              setEditForm((f) => f && { ...f, notes: e.target.value })
                            }
                            className="w-full rounded border border-stone-300 px-2 py-1.5 text-sm text-stone-800 placeholder:text-stone-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                            placeholder="Optional note about this book"
                          />
                        </div>
                      </div>
                      <div className="mt-3 flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(book.id)}
                          disabled={savingEditBookId === book.id}
                          className="rounded bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        >
                          {savingEditBookId === book.id ? "Saving…" : "Save"}
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          className="rounded border border-stone-300 bg-white px-3 py-1.5 text-sm text-stone-600 hover:bg-stone-50 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-serif text-lg font-semibold text-stone-900">
                            {book.title}
                          </h3>
                          <p className="text-stone-600">{book.author}</p>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                              {book.genre}
                            </span>
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                book.status === "read"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : book.status === "currently_reading"
                                    ? "bg-amber-100 text-amber-800"
                                    : "bg-sky-100 text-sky-800"
                              }`}
                            >
                              {statusLabel(book.status)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {session?.user?.name === book.addedBy && (
                            <button
                              type="button"
                              onClick={() => handleStartEdit(book)}
                              className="rounded border border-stone-300 bg-white px-2 py-1 text-xs text-stone-600 hover:bg-stone-50 focus:outline-none focus:ring-2 focus:ring-amber-500"
                            >
                              Edit
                            </button>
                          )}
                          <span className="text-sm text-stone-500">by {book.addedBy}</span>
                        </div>
                      </div>

                  {/* Your rating & notes (signed-in only) */}
                  {session && (
                    <div className="mt-4 rounded-lg border border-stone-200 bg-stone-50/80 px-3 py-3">
                      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-stone-600">
                        Your review
                      </p>
                      <div className="flex flex-wrap items-start gap-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-stone-700">Rating:</span>
                          <StarRating
                            value={myReview?.rating ?? null}
                            onChange={(n) => handleSaveReview(book.id, { rating: n })}
                            readonly={false}
                            size="md"
                          />
                          {savingReviewBookId === book.id && (
                            <span className="text-xs text-stone-400">Saving…</span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <label className="sr-only">Your notes</label>
                          <input
                            type="text"
                            placeholder="Add a note…"
                            defaultValue={myReview?.notes ?? ""}
                            onBlur={(e) => {
                              const v = e.target.value.trim();
                              if (v === (myReview?.notes ?? "")) return;
                              handleSaveReview(book.id, { notes: v || null });
                            }}
                            className="w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-800 placeholder:text-stone-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                          />
                        </div>
                        {myReview && (
                          <button
                            type="button"
                            onClick={() => handleHideReview(book.id)}
                            disabled={savingReviewBookId === book.id}
                            className="rounded border border-stone-300 bg-white px-2 py-1 text-xs text-stone-500 hover:bg-stone-50 hover:text-stone-700 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-amber-500"
                          >
                            {savingReviewBookId === book.id ? "Removing…" : "Delete review"}
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Other people's reviews */}
                  {otherReviews.length > 0 && (
                    <div className="mt-4 border-t border-stone-100 pt-4">
                      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-stone-500">
                        Others&apos; reviews
                      </p>
                      <ul className="space-y-2">
                        {otherReviews.map((r) => (
                          <li
                            key={r.id}
                            className="flex flex-wrap items-baseline gap-2 text-sm"
                          >
                            <span className="font-medium text-stone-700">
                              {r.user.name}:
                            </span>
                            {r.rating != null && (
                              <StarRating
                                value={r.rating}
                                readonly
                                size="sm"
                              />
                            )}
                            {r.notes && (
                              <span className="text-stone-600">&ldquo;{r.notes}&rdquo;</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
