import Link from "next/link";

export function LibraryHeader() {
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
        <nav aria-label="Primary navigation">
          <Link href="/books" className="border-b-2 border-[#a8734a] pb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#27312d]">Books</Link>
        </nav>
      </div>
    </header>
  );
}
