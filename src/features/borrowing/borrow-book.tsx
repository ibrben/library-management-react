"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ApiError, borrowBook, getValidAccessToken } from "@/services/api";
import type { Book } from "@/types/book";
import type { BorrowTransaction } from "@/types/borrowing";

interface BorrowBookProps {
  book: Book;
  onBorrowed: (transaction: BorrowTransaction) => void;
}

export function BorrowBook({ book, onBorrowed }: BorrowBookProps) {
  const router = useRouter();
  const [isConfirming, setIsConfirming] = useState(false);
  const [isBorrowing, setIsBorrowing] = useState(false);
  const [error, setError] = useState("");
  const [transaction, setTransaction] = useState<BorrowTransaction | null>(null);

  function beginBorrow() {
    if (!getValidAccessToken()) {
      router.push(`/login?returnTo=${encodeURIComponent(`/books/${book.id}`)}`);
      return;
    }
    setError("");
    setIsConfirming(true);
  }

  async function confirmBorrow() {
    setIsBorrowing(true);
    setError("");
    try {
      const result = await borrowBook(book.id);
      setTransaction(result);
      setIsConfirming(false);
      onBorrowed(result);
    } catch (requestError) {
      if (requestError instanceof ApiError && requestError.status === 401) {
        router.push(`/login?returnTo=${encodeURIComponent(`/books/${book.id}`)}`);
        return;
      }
      setError(requestError instanceof ApiError ? requestError.message : "We could not complete this borrowing request.");
    } finally {
      setIsBorrowing(false);
    }
  }

  if (transaction) {
    return (
      <div role="status" className="mt-8 border-l-2 border-[#58705d] bg-[#edf2ed] px-5 py-4 text-sm text-[#354d3a]">
        <p className="font-semibold">Book borrowed successfully</p>
        <p className="mt-1 text-xs leading-5">Borrowed {formatDate(transaction.borrowDate)}{transaction.dueDate ? ` · Due ${formatDate(transaction.dueDate)}` : ""}</p>
      </div>
    );
  }

  return (
    <>
      <div className="mt-8 border-t border-[#e7e2dc] pt-7">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8a7f75]">Circulation</p>
        <button type="button" disabled={book.availabilityStatus !== "Available"} onClick={beginBorrow} className="mt-4 flex h-12 w-full items-center justify-center bg-[#332c27] px-6 text-sm font-medium tracking-wide text-[#f9f8f6] transition hover:bg-[#4a4039] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9a8268] disabled:cursor-not-allowed disabled:bg-[#d9cfc7] disabled:text-[#6f6258]">
          {book.availabilityStatus === "Available" ? "Borrow this book" : "Currently borrowed"}
        </button>
        <p className="mt-3 text-xs leading-5 text-[#746b63]">A valid library account is required. Guests will be asked to sign in.</p>
        {error ? <p role="alert" className="mt-3 text-sm text-[#8a4039]">{error}</p> : null}
      </div>

      {isConfirming ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#332c27]/55 p-5" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !isBorrowing) setIsConfirming(false); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="borrow-title" className="w-full max-w-md border border-[#d9cfc7] bg-[#f9f8f6] p-7 shadow-2xl shadow-[#332c27]/20 sm:p-9">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#9a8268]">Confirm borrowing</p>
            <h2 id="borrow-title" className="mt-3 font-serif text-3xl text-[#332c27]">Take this volume home?</h2>
            <p className="mt-4 text-sm leading-6 text-[#6f6258]">You are borrowing <span className="font-medium text-[#332c27]">{book.title || "this book"}</span>. The transaction will be recorded against your signed-in account.</p>
            {error ? <p role="alert" className="mt-4 border-l-2 border-[#9b4c43] bg-[#9b4c43]/[0.07] px-4 py-3 text-sm text-[#7a3832]">{error}</p> : null}
            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button type="button" disabled={isBorrowing} onClick={() => setIsConfirming(false)} className="h-11 border border-[#cfc5bb] px-5 text-sm text-[#5f554d] disabled:opacity-50">Cancel</button>
              <button type="button" disabled={isBorrowing} onClick={() => void confirmBorrow()} className="h-11 bg-[#332c27] px-6 text-sm font-medium text-[#f9f8f6] disabled:opacity-60">{isBorrowing ? "Borrowing…" : "Confirm borrow"}</button>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(date);
}
