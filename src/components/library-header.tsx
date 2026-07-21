"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import type { UserRole } from "@/types/auth";

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function getRole(): UserRole | null {
  try { return JSON.parse(window.localStorage.getItem("user") ?? "null")?.role ?? null; } catch { return null; }
}

export function LibraryHeader({ active = "books" }: { active?: "books" | "dashboard" | "history" | "inventory" }) {
  const role = useSyncExternalStore(subscribe, getRole, () => null);
  const canManageInventory = role === "Administrator" || role === "Librarian";
  return (
    <header className="border-b border-[#ded8cf] bg-[#f7f5f1]">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8">
        <Link href="/books" className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center bg-[#2f3935] font-serif text-lg text-white">L</span>
          <span>
            <span className="block font-serif text-lg leading-none text-[#27312d]">The Library</span>
            <span className="mt-1.5 block text-[9px] uppercase tracking-[0.24em] text-[#897765]">Collection &amp; circulation</span>
          </span>
        </Link>
        <nav aria-label="Primary navigation" className="flex items-center gap-5 sm:gap-7">
          <Link href="/dashboard" className={`pb-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#27312d] ${active === "dashboard" ? "border-b-2 border-[#a8734a]" : "border-b-2 border-transparent"}`}>Dashboard</Link>
          <Link href="/books" className={`pb-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#27312d] ${active === "books" ? "border-b-2 border-[#a8734a]" : "border-b-2 border-transparent"}`}>Books</Link>
          {role === "EndUser" ? <Link href="/history" className={`pb-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#27312d] ${active === "history" ? "border-b-2 border-[#a8734a]" : "border-b-2 border-transparent"}`}>History</Link> : null}
          {canManageInventory ? <Link href="/inventory" className={`pb-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#27312d] ${active === "inventory" ? "border-b-2 border-[#a8734a]" : "border-b-2 border-transparent"}`}>Inventory</Link> : null}
        </nav>
      </div>
    </header>
  );
}
