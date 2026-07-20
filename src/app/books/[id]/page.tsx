"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { LibraryHeader } from "@/components/library-header";
import { ApiError, getBook, getStoredUser } from "@/services/api";
import { useRouter } from "next/navigation";
import { BorrowBook } from "@/features/borrowing/borrow-book";
import type { Book } from "@/types/book";

export default function BookDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!getStoredUser()) {
      router.replace(`/login?returnTo=${encodeURIComponent(`/books/${id}`)}`);
      return;
    }
    let active = true;
    async function loadBook() {
      try {
        const result = await getBook(id);
        if (active) setBook(result);
      } catch (requestError) {
        if (!active) return;
        setError(requestError instanceof ApiError && requestError.status === 404 ? "This book could not be found." : requestError instanceof ApiError ? requestError.message : "We could not reach the library service.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void loadBook();
    return () => { active = false; };
  }, [id, router]);

  return (
    <div className="min-h-screen bg-[#f7f5f1] text-[#27312d]">
      <LibraryHeader />
      <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
        <Link href="/books" className="text-xs font-semibold uppercase tracking-[0.14em] text-[#80644f] hover:text-[#a15f32]">← Back to collection</Link>
        {loading ? (
          <div className="mt-9 grid animate-pulse gap-px bg-[#ded8cf] lg:grid-cols-[minmax(280px,0.72fr)_1.28fr]"><div className="min-h-96 bg-[#313b37]" /><div className="min-h-96 bg-white p-10"><div className="h-4 w-28 bg-[#ece8e2]" /><div className="mt-8 h-12 w-4/5 bg-[#ece8e2]" /></div></div>
        ) : error || !book ? (
          <div className="mt-9 border border-[#ded8cf] bg-white px-6 py-20 text-center"><p className="font-serif text-3xl">Unable to open this volume</p><p className="mt-3 text-sm text-[#746b63]">{error}</p></div>
        ) : (
          <article className="mt-9 grid gap-px border border-[#ded8cf] bg-[#ded8cf] lg:grid-cols-[minmax(280px,0.72fr)_1.28fr]">
            <div className="flex min-h-[410px] flex-col justify-between bg-[#313b37] p-8 text-white sm:p-10">
              <div className="flex items-start justify-between gap-3"><span className="text-[10px] uppercase tracking-[0.2em] text-[#cdbba9]">{book.category || "Library volume"}</span><span className={`px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em] ${book.availabilityStatus === "Available" ? "bg-[#dce9df] text-[#31543d]" : "bg-[#e9d9c9] text-[#754929]"}`}>{book.availabilityStatus}</span></div>
              <div><div className="mb-7 h-px w-12 bg-[#b98a64]" /><h1 className="font-serif text-4xl leading-[1.08] tracking-[-0.025em] sm:text-5xl">{book.title || "Untitled"}</h1><p className="mt-5 text-sm text-[#d4cdc7]">by {book.author || "Unknown author"}</p></div>
              <p className="font-mono text-xs tracking-[0.1em] text-[#bdb5ae]">ISBN {book.isbn || "Not recorded"}</p>
            </div>
            <div className="bg-white p-7 sm:p-10 lg:p-12">
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#a8734a]">Catalogue record</p>
              <h2 className="mt-3 font-serif text-3xl">Book details</h2>
              <dl className="mt-9 grid gap-x-8 sm:grid-cols-2">
                <Detail label="Author" value={book.author} />
                <Detail label="Publisher" value={book.publisher} />
                <Detail label="Publication year" value={book.publicationYear?.toString()} />
                <Detail label="Category" value={book.category} />
                <Detail label="Shelf location" value={book.shelf} />
                <Detail label="ISBN" value={book.isbn} mono />
                <Detail label="Added to catalogue" value={formatDate(book.createdAt)} />
                <Detail label="Last updated" value={formatDate(book.updatedAt)} />
              </dl>
              <BorrowBook
                book={book}
                onBorrowed={() => setBook((current) => current ? { ...current, availabilityStatus: "Borrowed" } : current)}
              />
            </div>
          </article>
        )}
      </main>
    </div>
  );
}

function Detail({ label, value, mono = false }: { label: string; value: string | null | undefined; mono?: boolean }) {
  return <div className="border-t border-[#e7e2dc] py-5"><dt className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8a7f75]">{label}</dt><dd className={`mt-2 text-sm text-[#343d39] ${mono ? "font-mono" : ""}`}>{value || "Not recorded"}</dd></div>;
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Not recorded" : new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(date);
}
