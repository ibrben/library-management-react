"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LibraryHeader } from "@/components/library-header";
import { ApiError, clearStoredSession, getBooks, getBorrowings, getMyBorrowings, getStoredUser } from "@/services/api";
import type { AuthenticatedUser } from "@/types/auth";
import type { BorrowTransaction } from "@/types/borrowing";

interface DashboardData {
  totalBooks: number;
  availableBooks: number;
  activeBorrowings: number;
  recentTransactions: BorrowTransaction[];
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");

  function logout() {
    clearStoredSession();
    router.replace("/login");
    router.refresh();
  }

  useEffect(() => {
    const currentUser = getStoredUser();
    if (!currentUser) {
      router.replace("/login?returnTo=%2Fdashboard");
      return;
    }
    const sessionUser = currentUser;

    // The session is browser-owned, so it is restored after hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUser(sessionUser);
    let active = true;

    async function loadDashboard() {
      try {
        const isStaff = sessionUser.role === "Administrator" || sessionUser.role === "Librarian";
        const [allBooks, availableBooks, activeBorrowings] = await Promise.all([
          getBooks({ page: 1, pageSize: 1 }),
          getBooks({ availability: "Available", page: 1, pageSize: 1 }),
          isStaff
            ? getBorrowings({ status: "Borrowed", page: 1, pageSize: 6 })
            : getMyBorrowings({ status: "Borrowed", page: 1, pageSize: 6 }),
        ]);
        if (!active) return;
        setData({
          totalBooks: allBooks.totalCount,
          availableBooks: availableBooks.totalCount,
          activeBorrowings: activeBorrowings.totalCount,
          recentTransactions: activeBorrowings.items ?? [],
        });
      } catch (requestError) {
        if (!active) return;
        if (requestError instanceof ApiError && requestError.status === 401) {
          router.replace("/login?returnTo=%2Fdashboard");
          return;
        }
        setError(requestError instanceof ApiError ? requestError.message : "We could not load the dashboard.");
      }
    }

    void loadDashboard();
    return () => { active = false; };
  }, [router]);

  return (
    <div className="min-h-screen bg-[#f9f8f6] text-[#332c27]">
      <LibraryHeader active="dashboard" />
      <main className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
        {!user ? <DashboardSkeleton /> : (
          <>
            <header className="flex flex-col justify-between gap-6 border-b border-[#d9cfc7] pb-9 sm:flex-row sm:items-end">
              <div>
                <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.26em] text-[#9a8268]">{roleLabel(user.role)} workspace</p>
                <h1 className="font-serif text-4xl tracking-[-0.025em] sm:text-5xl">Good day, {displayName(user)}</h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6f6258]">{roleIntroduction(user.role)}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-fit border border-[#c9b59c] bg-[#efe9e3] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#6f6258]">{roleLabel(user.role)}</span>
                <button type="button" onClick={logout} className="border border-[#b9ada3] bg-transparent px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#5e534b] transition hover:border-[#8f7a68] hover:bg-[#efe9e3] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9a8268]">Log out</button>
              </div>
            </header>

            {error ? <div role="alert" className="mt-8 border-l-2 border-[#9b4c43] bg-white px-5 py-4 text-sm text-[#7a3832]">{error}</div> : null}

            <section aria-label="Library overview" className="mt-8 grid gap-px border border-[#d9cfc7] bg-[#d9cfc7] sm:grid-cols-3">
              <Metric label="Catalogue volumes" value={data?.totalBooks} note="Across the collection" />
              <Metric label="Available now" value={data?.availableBooks} note="Ready to borrow" />
              <Metric label={user.role === "EndUser" ? "My active loans" : "Active loans"} value={data?.activeBorrowings} note={user.role === "EndUser" ? "On your account" : "Across all members"} />
            </section>

            <div className="mt-8 grid gap-8 lg:grid-cols-[1.45fr_0.75fr]">
              <section className="border border-[#d9cfc7] bg-white">
                <div className="flex items-center justify-between border-b border-[#e4ddd6] px-6 py-5">
                  <div><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#9a8268]">Circulation</p><h2 className="mt-1 font-serif text-2xl">{user.role === "EndUser" ? "Books you have out" : "Current borrowing activity"}</h2></div>
                </div>
                {!data ? <div className="h-64 animate-pulse bg-[#f4f1ed]" /> : data.recentTransactions.length === 0 ? <div className="px-6 py-16 text-center"><p className="font-serif text-xl">No active borrowings</p><p className="mt-2 text-sm text-[#6f6258]">Borrowed volumes will appear here.</p></div> : (
                  <ul className="divide-y divide-[#e9e3dc]">
                    {data.recentTransactions.map((transaction) => <li key={transaction.id} className="flex flex-col justify-between gap-3 px-6 py-5 sm:flex-row sm:items-center"><div><Link href={`/books/${transaction.bookId}`} className="font-serif text-lg hover:text-[#8a5d3b]">{transaction.bookTitle || "Untitled volume"}</Link><p className="mt-1 text-xs text-[#7c7066]">{user.role === "EndUser" ? `Borrowed ${formatDate(transaction.borrowDate)}` : `${transaction.username || "Unknown member"} · ${formatDate(transaction.borrowDate)}`}</p></div><div className="text-left sm:text-right"><p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#9a8268]">Due date</p><p className="mt-1 text-xs text-[#554c45]">{transaction.dueDate ? formatDate(transaction.dueDate) : "Not assigned"}</p></div></li>)}
                  </ul>
                )}
              </section>

              <aside className="border border-[#d9cfc7] bg-[#efe9e3] p-6 sm:p-7">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#9a8268]">Quick actions</p>
                <h2 className="mt-2 font-serif text-2xl">Your workspace</h2>
                <div className="mt-6 space-y-3">
                  <Action href={user.role === "EndUser" ? "/books" : "/inventory"} title={user.role === "EndUser" ? "Browse the collection" : "Open inventory system"} description={user.role === "EndUser" ? "Find your next book" : "Review catalogue, circulation, borrowing, and returns"} />
                  {user.role === "Administrator" ? <Responsibility title="Administration" description="Full access to inventory, circulation, and member operations." /> : null}
                  {user.role === "Librarian" ? <Responsibility title="Circulation desk" description="Manage inventory, borrowing, returns, and reader service." /> : null}
                  {user.role === "EndUser" ? <Action href="/history" title="Borrow history" description="Review or return books on your account" /> : null}
                </div>
              </aside>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function Metric({ label, value, note }: { label: string; value?: number; note: string }) {
  return <div className="bg-white p-6 sm:p-7"><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8d7c6d]">{label}</p><p className="mt-5 font-serif text-4xl">{value ?? "—"}</p><p className="mt-2 text-xs text-[#7a6e64]">{note}</p></div>;
}

function Action({ href, title, description }: { href: string; title: string; description: string }) {
  return <Link href={href} className="block border border-[#d2c7bd] bg-[#f9f8f6] p-4 transition hover:border-[#9a8268]"><span className="text-sm font-medium">{title} →</span><span className="mt-1 block text-xs leading-5 text-[#74685f]">{description}</span></Link>;
}

function Responsibility({ title, description }: { title: string; description: string }) {
  return <div className="border-t border-[#d2c7bd] pt-4"><p className="text-xs font-semibold uppercase tracking-[0.13em]">{title}</p><p className="mt-2 text-xs leading-5 text-[#74685f]">{description}</p></div>;
}

function DashboardSkeleton() {
  return <div className="animate-pulse"><div className="h-12 w-2/3 bg-[#e9e3dc]" /><div className="mt-8 grid gap-px bg-[#d9cfc7] sm:grid-cols-3">{Array.from({ length: 3 }).map((_, index) => <div key={index} className="h-36 bg-white" />)}</div></div>;
}

function displayName(user: AuthenticatedUser) { return user.firstName || user.username || "reader"; }
function roleLabel(role: AuthenticatedUser["role"]) { return role === "EndUser" ? "Member" : role; }
function roleIntroduction(role: AuthenticatedUser["role"]) {
  if (role === "Administrator") return "A complete view of the collection, circulation, and library operations.";
  if (role === "Librarian") return "Keep the collection available and every borrowing record in good order.";
  return "Explore the collection and keep track of the books currently on your account.";
}
function formatDate(value: string) { const date = new Date(value); return Number.isNaN(date.getTime()) ? "Not recorded" : new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(date); }
