"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { LibraryHeader } from "@/components/library-header";
import { ReturnButton } from "@/features/borrowing/return-button";
import { ApiError, getBorrowings, getEndUsers, getMyBorrowings, getStoredUser } from "@/services/api";
import type { AuthenticatedUser, EndUserListItem } from "@/types/auth";
import type { BorrowStatus, BorrowTransaction } from "@/types/borrowing";

export default function HistoryPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [endUsers, setEndUsers] = useState<EndUserListItem[]>([]);
  const [transactions, setTransactions] = useState<BorrowTransaction[]>([]);
  const [status, setStatus] = useState<BorrowStatus | "">("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [directoryError, setDirectoryError] = useState("");
  const [error, setError] = useState("");

  const loadDirectory = useCallback(async () => {
    setDirectoryError("");
    try {
      setEndUsers(await getEndUsers());
    } catch (requestError) {
      if (requestError instanceof ApiError && requestError.status === 401) { router.replace("/login?returnTo=%2Fhistory"); return; }
      setDirectoryError(requestError instanceof ApiError ? requestError.message : "We could not load the end-user directory.");
    }
  }, [router]);

  const load = useCallback(async (sessionUser: AuthenticatedUser) => {
    await Promise.resolve();
    setLoading(true);
    setError("");
    try {
      const result = isStaff(sessionUser)
        ? await getBorrowings({ userId: selectedUserId || undefined, status: status || undefined, page, pageSize: 10 })
        : await getMyBorrowings({ status: status || undefined, page, pageSize: 10 });
      setTransactions(result.items ?? []);
      setTotalPages(result.totalPages);
    } catch (requestError) {
      if (requestError instanceof ApiError && requestError.status === 401) { router.replace("/login?returnTo=%2Fhistory"); return; }
      setError(requestError instanceof ApiError ? requestError.message : "We could not load borrowing history.");
    } finally { setLoading(false); }
  }, [page, router, selectedUserId, status]);

  useEffect(() => {
    const currentUser = getStoredUser();
    if (!currentUser) { router.replace("/login?returnTo=%2Fhistory"); return; }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUser(currentUser);
    if (isStaff(currentUser)) void loadDirectory();
    void load(currentUser);
  }, [load, loadDirectory, router]);

  function markReturned(result: BorrowTransaction) {
    if (status === "Borrowed") setTransactions((items) => items.filter((item) => item.id !== result.id));
    else setTransactions((items) => items.map((item) => item.id === result.id ? result : item));
  }

  return <div className="min-h-screen bg-[#f9f8f6] text-[#332c27]">
    <LibraryHeader active="history" />
    <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
      <header className="flex flex-col justify-between gap-5 border-b border-[#d9cfc7] pb-8 sm:flex-row sm:items-end">
        <div><p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#9a8268]">{user && isStaff(user) ? "Staff circulation" : "Member account"}</p><h1 className="font-serif text-4xl sm:text-5xl">Transaction history</h1><p className="mt-3 text-sm text-[#6f6258]">{user && isStaff(user) ? "Review borrowing and return activity across library members." : "Review and return books borrowed on your account."}</p></div>
        <div className="flex flex-col gap-3 sm:flex-row">
          {user && isStaff(user) ? <select aria-label="Filter end user" value={selectedUserId} onChange={(event) => { setPage(1); setSelectedUserId(event.target.value); }} className="h-11 border border-[#d9cfc7] bg-white px-4 text-sm"><option value="">All end users</option>{endUsers.map((member) => <option key={member.id} value={member.id}>{displayEndUser(member)}</option>)}</select> : null}
          <select aria-label="Filter borrowing status" value={status} onChange={(event) => { setPage(1); setStatus(event.target.value as BorrowStatus | ""); }} className="h-11 border border-[#d9cfc7] bg-white px-4 text-sm"><option value="">All transactions</option><option value="Borrowed">Currently borrowed</option><option value="Returned">Returned</option></select>
        </div>
      </header>
      {directoryError ? <div role="alert" className="mt-7 border-l-2 border-[#9b4c43] bg-white px-5 py-4 text-sm text-[#7a3832]">{directoryError}</div> : null}
      {error ? <div role="alert" className="mt-7 border-l-2 border-[#9b4c43] bg-white px-5 py-4 text-sm text-[#7a3832]">{error}</div> : loading ? <div className="mt-7 h-72 animate-pulse border border-[#d9cfc7] bg-white" /> : transactions.length === 0 ? <div className="mt-7 border border-[#d9cfc7] bg-white py-16 text-center"><p className="font-serif text-2xl">No borrowing records</p><Link href="/books" className="mt-4 inline-block text-sm underline underline-offset-4">Browse the collection</Link></div> :
        <div className="mt-7 overflow-x-auto border border-[#d9cfc7] bg-white"><table className="w-full min-w-[840px] text-left text-sm"><thead className="border-b border-[#d9cfc7] bg-[#efe9e3] text-[10px] uppercase tracking-[0.14em] text-[#6f6258]"><tr><th className="px-5 py-4">Book</th>{user && isStaff(user) ? <th className="px-5 py-4">Member</th> : null}<th className="px-5 py-4">Borrowed</th><th className="px-5 py-4">Due / returned</th><th className="px-5 py-4">Status</th><th className="px-5 py-4 text-right">Action</th></tr></thead><tbody className="divide-y divide-[#e9e3dc]">{transactions.map((item) => <tr key={item.id}><td className="px-5 py-4"><Link href={`/books/${item.bookId}`} className="font-serif text-lg hover:text-[#8a5d3b]">{item.bookTitle || "Untitled"}</Link><p className="mt-1 font-mono text-[10px] text-[#83776d]">{item.isbn || "No ISBN"}</p></td>{user && isStaff(user) ? <td className="px-5 py-4 text-xs text-[#6f6258]"><p>{item.username || "Unknown member"}</p><p className="mt-1 font-mono text-[9px] text-[#83776d]">{item.userId}</p></td> : null}<td className="px-5 py-4 text-[#6f6258]">{formatDate(item.borrowDate)}</td><td className="px-5 py-4 text-[#6f6258]">{formatDate(item.returnDate || item.dueDate)}</td><td className="px-5 py-4"><span className={`px-2 py-1 text-[9px] font-semibold uppercase ${item.status === "Borrowed" ? "bg-[#f1e8df] text-[#875533]" : "bg-[#e6eee8] text-[#376046]"}`}>{item.status}</span></td><td className="px-5 py-4 text-right">{item.status === "Borrowed" ? <ReturnButton transaction={item} onReturned={markReturned} /> : "—"}</td></tr>)}</tbody></table></div>}
      {totalPages > 1 ? <div className="mt-6 flex items-center justify-between text-sm"><span>Page {page} of {totalPages}</span><div className="flex gap-2"><button disabled={page <= 1} onClick={() => setPage((value) => value - 1)} className="border border-[#cfc7bd] bg-white px-4 py-2 disabled:opacity-40">Previous</button><button disabled={page >= totalPages} onClick={() => setPage((value) => value + 1)} className="border border-[#cfc7bd] bg-white px-4 py-2 disabled:opacity-40">Next</button></div></div> : null}
    </main>
  </div>;
}

function formatDate(value: string | null) { if (!value) return "Not assigned"; const date = new Date(value); return Number.isNaN(date.getTime()) ? "Not recorded" : new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(date); }
function isStaff(user: AuthenticatedUser) { return user.role === "Administrator" || user.role === "Librarian"; }
function displayEndUser(user: EndUserListItem) { return user.username || user.id; }
