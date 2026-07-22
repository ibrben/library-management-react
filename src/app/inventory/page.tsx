"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { LibraryHeader } from "@/components/library-header";
import { ReturnButton } from "@/features/borrowing/return-button";
import { ApiError, borrowBookForUser, getBooks, getBorrowings, getEndUsers, getStoredUser } from "@/services/api";
import type { EndUserListItem } from "@/types/auth";
import type { BorrowTransaction } from "@/types/borrowing";

const UUID_PATTERN = "[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}";

export default function InventoryPage() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<BorrowTransaction[]>([]);
  const [returnLoans, setReturnLoans] = useState<BorrowTransaction[]>([]);
  const [endUsers, setEndUsers] = useState<EndUserListItem[]>([]);
  const [totalBooks, setTotalBooks] = useState<number | null>(null);
  const [availableBooks, setAvailableBooks] = useState<number | null>(null);
  const [bookId, setBookId] = useState("");
  const [userId, setUserId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [selectedReturnUserId, setSelectedReturnUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [returnLoading, setReturnLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [directoryError, setDirectoryError] = useState("");
  const [returnError, setReturnError] = useState("");
  const [success, setSuccess] = useState("");

  const loadReturnLoans = useCallback(async (returnUserId: string) => {
    setReturnLoading(true);
    setReturnError("");
    try {
      const result = await getBorrowings({ userId: returnUserId || undefined, status: "Borrowed", page: 1, pageSize: 100 });
      setReturnLoans(result.items ?? []);
    } catch (requestError) {
      if (requestError instanceof ApiError && requestError.status === 401) { router.replace("/login?returnTo=%2Finventory"); return; }
      setReturnError(requestError instanceof ApiError ? requestError.message : "We could not load borrowed books for this end user.");
      setReturnLoans([]);
    } finally {
      setReturnLoading(false);
    }
  }, [router]);

  const loadInventory = useCallback(async () => {
    await Promise.resolve();
    setLoading(true);
    setError("");
    setDirectoryError("");
    const [allBooks, available, activeLoans, endUserList] = await Promise.allSettled([
        getBooks({ page: 1, pageSize: 1 }),
        getBooks({ availability: "Available", page: 1, pageSize: 1 }),
        getBorrowings({ status: "Borrowed", page: 1, pageSize: 100 }),
        getEndUsers(),
      ]);

    if (allBooks.status === "fulfilled") setTotalBooks(allBooks.value.totalCount);
    if (available.status === "fulfilled") setAvailableBooks(available.value.totalCount);
    if (activeLoans.status === "fulfilled") setTransactions(activeLoans.value.items ?? []);
    if (endUserList.status === "fulfilled") {
      setEndUsers(endUserList.value);
    } else {
      if (endUserList.reason instanceof ApiError && endUserList.reason.status === 401) { router.replace("/login?returnTo=%2Finventory"); return; }
      setDirectoryError(endUserList.reason instanceof ApiError ? endUserList.reason.message : "We could not load the end-user directory.");
    }

    const firstFailure = [allBooks, available, activeLoans].find((result) => result.status === "rejected");
    if (firstFailure?.status === "rejected") {
      if (firstFailure.reason instanceof ApiError && firstFailure.reason.status === 401) { router.replace("/login?returnTo=%2Finventory"); return; }
      setError(firstFailure.reason instanceof ApiError ? firstFailure.reason.message : "We could not load all inventory data.");
    }

    setLoading(false);
  }, [router]);

  useEffect(() => {
    const user = getStoredUser();
    if (!user) { router.replace("/login?returnTo=%2Finventory"); return; }
    if (user.role !== "Administrator" && user.role !== "Librarian") { router.replace("/dashboard"); return; }
    const selectedBook = new URLSearchParams(window.location.search).get("bookId");
    // Restore a catalogue selection after the role guard has passed.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (selectedBook) setBookId(selectedBook);
    void loadInventory();
    void loadReturnLoans("");
  }, [loadInventory, loadReturnLoans, router]);

  async function submitBorrow(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true); setError(""); setSuccess("");
    try {
      const transaction = await borrowBookForUser(bookId.trim(), userId, dueDate ? new Date(dueDate).toISOString() : undefined);
      setSuccess(`${transaction.bookTitle || "Book"} was borrowed for ${transaction.username || "the selected member"}.`);
      setBookId(""); setUserId(""); setDueDate("");
      await loadInventory();
      await loadReturnLoans(selectedReturnUserId);
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : "We could not complete the borrowing request.");
    } finally { setSubmitting(false); }
  }

  const endUserOptions = useMemo(() => endUsersByName(transactions, endUsers), [endUsers, transactions]);

  async function selectReturnUser(nextUserId: string) {
    setSelectedReturnUserId(nextUserId);
    await loadReturnLoans(nextUserId);
  }

  async function markReturned(result: BorrowTransaction) {
    setTransactions((items) => items.filter((item) => item.id !== result.id));
    setReturnLoans((items) => items.filter((item) => item.id !== result.id));
    setSuccess(`${result.bookTitle || "Book"} was returned successfully.`);
    await loadInventory();
    await loadReturnLoans(selectedReturnUserId);
  }

  return <div className="min-h-screen bg-[#f9f8f6] text-[#332c27]">
    <LibraryHeader active="inventory" />
    <main className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
      <header className="border-b border-[#d9cfc7] pb-8"><p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#9a8268]">Staff workspace</p><h1 className="font-serif text-4xl sm:text-5xl">Inventory &amp; circulation</h1><p className="mt-3 text-sm text-[#6f6258]">Review availability and process borrowing or returns for library members.</p></header>
      <section aria-label="Inventory overview" className="mt-8 grid gap-px border border-[#d9cfc7] bg-[#d9cfc7] sm:grid-cols-3"><Metric label="Catalogue volumes" value={totalBooks} /><Metric label="Available now" value={availableBooks} /><Metric label="Active loans" value={transactions.length} /></section>
      {error ? <p role="alert" className="mt-7 border-l-2 border-[#9b4c43] bg-white px-5 py-4 text-sm text-[#7a3832]">{error}</p> : null}
      {success ? <p role="status" className="mt-7 border-l-2 border-[#58705d] bg-[#edf2ed] px-5 py-4 text-sm text-[#354d3a]">{success}</p> : null}
      <div className="mt-8 grid gap-8 lg:grid-cols-[0.72fr_1.28fr]">
        <section className="h-fit border border-[#d9cfc7] bg-white p-6 sm:p-7">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#9a8268]">Assisted borrowing</p><h2 className="mt-2 font-serif text-2xl">Issue a book</h2>
          <p className="mt-3 text-xs leading-5 text-[#74685f]">Select an end user from the directory and issue an available book to their account.</p>
          <form onSubmit={submitBorrow} className="mt-6 space-y-5">
            <Field label="Book UUID" value={bookId} onChange={setBookId} pattern={UUID_PATTERN} placeholder="00000000-0000-0000-0000-000000000000" />
            <div><label htmlFor="borrow-member" className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.15em] text-[#6f6258]">End user</label><select id="borrow-member" required value={userId} onChange={(event) => setUserId(event.target.value)} disabled={loading || endUsers.length === 0} className="h-11 w-full border border-[#d9cfc7] bg-[#f9f8f6] px-3 text-sm outline-none focus:border-[#9a8268] disabled:opacity-55"><option value="">{loading ? "Loading end users..." : endUsers.length === 0 ? "No end users available" : "Select an end user"}</option>{endUsersByName([], endUsers).map((user) => <option key={user.id} value={user.id}>{displayEndUser(user)}</option>)}</select>{directoryError ? <p className="mt-2 text-xs leading-5 text-[#7a3832]">{directoryError}</p> : endUsers.length === 0 && !loading ? <p className="mt-2 text-xs leading-5 text-[#74685f]">No end users were returned from the directory endpoint.</p> : null}</div>
            <div><label htmlFor="due-date" className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.15em] text-[#6f6258]">Due date (optional)</label><input id="due-date" type="datetime-local" value={dueDate} onChange={(event) => setDueDate(event.target.value)} className="h-11 w-full border border-[#d9cfc7] bg-[#f9f8f6] px-3 text-sm outline-none focus:border-[#9a8268]" /></div>
            <button disabled={submitting || !userId} className="h-12 w-full bg-[#332c27] text-sm font-medium text-white disabled:opacity-60">{submitting ? "Issuing…" : "Borrow for member"}</button>
          </form>
        </section>
        <section className="border border-[#d9cfc7] bg-white">
          <div className="flex flex-col justify-between gap-4 border-b border-[#d9cfc7] px-6 py-5 md:flex-row md:items-end"><div><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#9a8268]">Current circulation</p><h2 className="mt-1 font-serif text-2xl">Return borrowed books</h2></div><div className="flex flex-col gap-3 sm:flex-row sm:items-end"><div><label htmlFor="return-member" className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.15em] text-[#6f6258]">End user</label><select id="return-member" value={selectedReturnUserId} onChange={(event) => void selectReturnUser(event.target.value)} disabled={loading || returnLoading || endUserOptions.length === 0} className="h-11 min-w-60 border border-[#d9cfc7] bg-[#f9f8f6] px-3 text-sm outline-none focus:border-[#9a8268] disabled:opacity-55"><option value="">All active borrowers</option>{endUserOptions.map((user) => <option key={user.id} value={user.id}>{displayEndUser(user)}</option>)}</select></div><Link href="/books" className="pb-3 text-xs underline underline-offset-4">Open catalogue</Link></div></div>
          {returnError ? <p role="alert" className="mx-6 mt-5 border-l-2 border-[#9b4c43] bg-[#fff8f6] px-4 py-3 text-sm text-[#7a3832]">{returnError}</p> : null}
          {loading || returnLoading ? <div className="h-72 animate-pulse bg-[#f4f1ed]" /> : returnLoans.length === 0 ? <div className="py-16 text-center"><p className="font-serif text-xl">{selectedReturnUserId ? "No borrowed books for this end user" : "No active loans"}</p>{selectedReturnUserId ? <button type="button" onClick={() => void selectReturnUser("")} className="mt-4 text-sm underline underline-offset-4">Show all active borrowers</button> : null}</div> : <div className="overflow-x-auto"><table className="w-full min-w-[670px] text-left"><thead className="bg-[#efe9e3] text-[10px] uppercase tracking-[0.13em] text-[#6f6258]"><tr><th className="px-5 py-3">Book</th><th className="px-5 py-3">Member</th><th className="px-5 py-3">Due</th><th className="px-5 py-3 text-right">Action</th></tr></thead><tbody className="divide-y divide-[#e9e3dc]">{returnLoans.map((item) => <tr key={item.id}><td className="px-5 py-4"><Link href={`/books/${item.bookId}`} className="font-serif text-base hover:text-[#8a5d3b]">{item.bookTitle || "Untitled"}</Link><p className="mt-1 font-mono text-[9px] text-[#83776d]">{item.isbn || item.bookId}</p></td><td className="px-5 py-4 text-xs"><p>{item.username || "Unknown member"}</p><p className="mt-1 font-mono text-[9px] text-[#83776d]">{item.userId}</p></td><td className="px-5 py-4 text-xs text-[#6f6258]">{formatDate(item.dueDate)}</td><td className="px-5 py-4 text-right"><ReturnButton transaction={item} onReturned={(returned) => { void markReturned(returned); }} /></td></tr>)}</tbody></table></div>}
        </section>
      </div>
    </main>
  </div>;
}

function Metric({ label, value }: { label: string; value: number | null }) { return <div className="bg-white p-6"><p className="text-[10px] font-semibold uppercase tracking-[0.17em] text-[#8d7c6d]">{label}</p><p className="mt-4 font-serif text-4xl">{value ?? "—"}</p></div>; }
function Field({ label, value, onChange, pattern, placeholder }: { label: string; value: string; onChange: (value: string) => void; pattern: string; placeholder: string }) { const id = label.toLowerCase().replaceAll(" ", "-"); return <div><label htmlFor={id} className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.15em] text-[#6f6258]">{label}</label><input id={id} required pattern={pattern} title="Enter a valid UUID" value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="h-11 w-full border border-[#d9cfc7] bg-[#f9f8f6] px-3 font-mono text-xs outline-none focus:border-[#9a8268]" /></div>; }
function formatDate(value: string | null) { if (!value) return "Not assigned"; const date = new Date(value); return Number.isNaN(date.getTime()) ? "Not recorded" : new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(date); }
function displayEndUser(user: EndUserListItem) { return user.username || user.id; }
function endUsersByName(transactions: BorrowTransaction[], users: EndUserListItem[]) {
  const members = new Map<string, EndUserListItem>();
  for (const user of users) {
    if (user.id) members.set(user.id, user);
  }
  for (const transaction of transactions) {
    if (transaction.userId && !members.has(transaction.userId)) members.set(transaction.userId, { id: transaction.userId, username: transaction.username });
  }
  return Array.from(members.values()).sort((first, second) => displayEndUser(first).localeCompare(displayEndUser(second)));
}
