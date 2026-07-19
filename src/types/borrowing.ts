export type BorrowStatus = "Borrowed" | "Returned";

export interface BorrowBookRequest {
  bookId: string;
  userId?: string | null;
  dueDate?: string | null;
}

export interface BorrowTransaction {
  id: string;
  userId: string;
  username: string | null;
  bookId: string;
  isbn: string | null;
  bookTitle: string | null;
  borrowDate: string;
  dueDate: string | null;
  returnDate: string | null;
  status: BorrowStatus;
}
