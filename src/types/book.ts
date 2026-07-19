export type BookAvailabilityStatus = "Available" | "Borrowed";

export interface Book {
  id: string;
  isbn: string | null;
  title: string | null;
  author: string | null;
  publisher: string | null;
  publicationYear: number | null;
  category: string | null;
  shelf: string | null;
  availabilityStatus: BookAvailabilityStatus;
  createdAt: string;
  updatedAt: string;
}

export interface BookPage {
  items: Book[] | null;
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface BookQuery {
  isbn?: string;
  title?: string;
  author?: string;
  category?: string;
  availability?: BookAvailabilityStatus;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}
