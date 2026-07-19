"use client";

import Link from "next/link";
import { type FormEvent, useCallback, useEffect, useState } from "react";
import { LibraryHeader } from "@/components/library-header";
import { ApiError, getBooks } from "@/services/api";
import type { Book, BookAvailabilityStatus } from "@/types/book";

const PAGE_SIZE = 12;

export default function BooksPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [search, setSearch] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [availability, setAvailability] = useState<BookAvailabilityStatus | "">("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadBooks = useCallback(async () => {
    // Keep state updates on the asynchronous side of the request boundary.
    await Promise.resolve();
    setLoading(true);
    setError("");
    try {
      const result = await getBooks({
        title: activeSearch || undefined,
        availability: availability || undefined,
        page,
        pageSize: PAGE_SIZE,
        sortBy: "Title",
        sortOrder: "asc",
      });
      setBooks(result.items ?? []);
      setTotalCount(result.totalCount);
      setTotalPages(result.totalPages);
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : "We could not reach the library service.");
    } finally {
      setLoading(false);
    }
  }, [activeSearch, availability, page]);

  useEffect(() => {
    // This effect intentionally starts the remote synchronization for its query.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadBooks();
  }, [loadBooks]);

  function submitSearch(event: FormEvent) {
    event.preventDefault();
    setPage(1);
    setActiveSearch(search.trim());
  }

  return (
    <div className="min-h-screen bg-[#f7f5f1] text-[#27312d]">
      <LibraryHeader />
      <main className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
        <div className="mb-10">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.26em] text-[#a8734a]">Library catalogue</p>
          <h1 className="font-serif text-4xl tracking-[-0.025em] sm:text-5xl">The collection</h1>
          <p className="mt-3 text-sm text-[#746b63]">Browse {totalCount || "the"} {totalCount === 1 ? "volume" : "volumes"} in the catalogue.</p>
        </div>

        <form onSubmit={submitSearch} className="mb-7 grid gap-3 border border-[#ded8cf] bg-white p-4 sm:grid-cols-[1fr_190px_auto]">
          <label className="sr-only" htmlFor="book-search">Search by title</label>
          <input id="book-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by title…" className="h-11 border border-[#d8d1c8] bg-[#fbfaf8] px-4 text-sm outline-none focus:border-[#a8734a]" />
          <label className="sr-only" htmlFor="availability">Availability</label>
          <select id="availability" value={availability} onChange={(event) => { setPage(1); setAvailability(event.target.value as BookAvailabilityStatus | ""); }} className="h-11 border border-[#d8d1c8] bg-[#fbfaf8] px-3 text-sm outline-none focus:border-[#a8734a]">
            <option value="">All availability</option>
            <option value="Available">Available</option>
            <option value="Borrowed">Borrowed</option>
          </select>
          <button className="h-11 bg-[#2f3935] px-7 text-xs font-semibold uppercase tracking-[0.14em] text-white hover:bg-[#45514c]">Search</button>
        </form>

        {error ? (
          <div role="alert" className="border-l-2 border-[#9b4c43] bg-white px-5 py-4 text-sm text-[#7a3832]">
            <p>{error}</p><button onClick={() => void loadBooks()} className="mt-2 font-semibold underline underline-offset-4">Try again</button>
          </div>
        ) : loading ? (
          <div className="grid gap-px border border-[#ded8cf] bg-[#ded8cf] sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-64 animate-pulse bg-white p-6"><div className="h-3 w-20 bg-[#ece8e2]" /><div className="mt-8 h-7 w-4/5 bg-[#ece8e2]" /><div className="mt-3 h-4 w-1/2 bg-[#ece8e2]" /></div>)}
          </div>
        ) : books.length === 0 ? (
          <div className="border border-[#ded8cf] bg-white px-6 py-20 text-center"><p className="font-serif text-2xl">No books found</p><p className="mt-2 text-sm text-[#746b63]">Try changing your search or availability filter.</p></div>
        ) : (
          <div className="grid gap-px border border-[#ded8cf] bg-[#ded8cf] sm:grid-cols-2 lg:grid-cols-3">
            {books.map((book) => (
              <Link key={book.id} href={`/books/${book.id}`} className="group flex min-h-64 flex-col bg-white p-6 transition hover:bg-[#fbfaf8]">
                <div className="flex items-start justify-between gap-3">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8a7f75]">{book.category || "Uncategorised"}</span>
                  <Status value={book.availabilityStatus} />
                </div>
                <div className="my-auto py-8"><h2 className="font-serif text-2xl leading-tight tracking-[-0.015em] group-hover:text-[#a15f32]">{book.title || "Untitled"}</h2><p className="mt-3 text-sm text-[#746b63]">by {book.author || "Unknown author"}</p></div>
                <div className="flex items-center justify-between border-t border-[#ebe7e1] pt-4 text-xs text-[#8a7f75]"><span>{book.publicationYear ?? "Year unknown"}</span><span className="font-medium text-[#6b4b34]">View details →</span></div>
              </Link>
            ))}
          </div>
        )}

        {!error && totalPages > 1 ? <div className="mt-7 flex items-center justify-between text-sm"><p className="text-[#746b63]">Page {page} of {totalPages}</p><div className="flex gap-2"><button disabled={page <= 1 || loading} onClick={() => setPage((value) => value - 1)} className="border border-[#cfc7bd] bg-white px-4 py-2 disabled:opacity-40">Previous</button><button disabled={page >= totalPages || loading} onClick={() => setPage((value) => value + 1)} className="border border-[#cfc7bd] bg-white px-4 py-2 disabled:opacity-40">Next</button></div></div> : null}
      </main>
    </div>
  );
}

function Status({ value }: { value: BookAvailabilityStatus }) {
  return <span className={`px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em] ${value === "Available" ? "bg-[#e6eee8] text-[#376046]" : "bg-[#f1e8df] text-[#875533]"}`}>{value}</span>;
}
