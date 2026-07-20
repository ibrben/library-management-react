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

export interface TransactionPage {
  items: BorrowTransaction[] | null;
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface BorrowingQuery {
  userId?: string;
  status?: BorrowStatus;
  page?: number;
  pageSize?: number;
}
