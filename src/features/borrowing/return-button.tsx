"use client";

import { useState } from "react";
import { ApiError, returnBorrowing } from "@/services/api";
import type { BorrowTransaction } from "@/types/borrowing";

export function ReturnButton({ transaction, onReturned }: { transaction: BorrowTransaction; onReturned: (result: BorrowTransaction) => void }) {
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    setSubmitting(true);
    setError("");
    try {
      onReturned(await returnBorrowing(transaction.id));
      setConfirming(false);
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : "We could not return this book.");
    } finally {
      setSubmitting(false);
    }
  }

  return <>
    <button type="button" onClick={() => setConfirming(true)} className="border border-[#b9ada3] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] hover:bg-[#efe9e3]">Return</button>
    {confirming ? <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#332c27]/55 p-5" onMouseDown={(event) => { if (event.target === event.currentTarget && !submitting) setConfirming(false); }}>
      <section role="dialog" aria-modal="true" aria-labelledby={`return-${transaction.id}`} className="w-full max-w-md border border-[#d9cfc7] bg-[#f9f8f6] p-8">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#9a8268]">Confirm return</p>
        <h2 id={`return-${transaction.id}`} className="mt-3 font-serif text-3xl">Return this volume?</h2>
        <p className="mt-4 text-sm leading-6 text-[#6f6258]">This will mark <strong className="font-medium text-[#332c27]">{transaction.bookTitle || "the selected book"}</strong> as returned.</p>
        {error ? <p role="alert" className="mt-4 border-l-2 border-[#9b4c43] px-4 py-2 text-sm text-[#7a3832]">{error}</p> : null}
        <div className="mt-7 flex justify-end gap-3"><button disabled={submitting} onClick={() => setConfirming(false)} className="h-11 border border-[#cfc5bb] px-5 text-sm">Cancel</button><button disabled={submitting} onClick={() => void submit()} className="h-11 bg-[#332c27] px-5 text-sm text-white disabled:opacity-60">{submitting ? "Returning…" : "Confirm return"}</button></div>
      </section>
    </div> : null}
  </>;
}
