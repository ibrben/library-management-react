import type { AuthenticatedUser, EndUserListItem, LoginRequest, LoginResponse } from "@/types/auth";
import type { Book, BookPage, BookQuery } from "@/types/book";
import type { BorrowBookRequest, BorrowingQuery, BorrowTransaction, TransactionPage } from "@/types/borrowing";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function getErrorMessage(response: Response, fallback: string) {
  try {
    const error = (await response.json()) as {
      detail?: string;
      message?: string;
      title?: string;
    };
    return error.detail ?? error.message ?? error.title ?? fallback;
  } catch {
    return fallback;
  }
}

async function apiGet<T>(path: string): Promise<T> {
  const token = getValidAccessToken();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    if (response.status === 401) clearStoredSession();
    const fallback = `Request failed with status ${response.status}`;
    throw new ApiError(
      await getErrorMessage(response, fallback),
      response.status,
    );
  }

  return (await response.json()) as T;
}

export function clearStoredSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem("accessToken");
  window.localStorage.removeItem("tokenExpiresAt");
  window.localStorage.removeItem("user");
}

export function getValidAccessToken(): string | null {
  if (typeof window === "undefined") return null;

  const token = window.localStorage.getItem("accessToken");
  const expiresAt = window.localStorage.getItem("tokenExpiresAt");
  if (!token) return null;

  if (expiresAt) {
    const expiry = new Date(expiresAt).getTime();
    if (!Number.isFinite(expiry) || expiry <= Date.now()) {
      clearStoredSession();
      return null;
    }
  }

  return token;
}

export function getStoredUser(): AuthenticatedUser | null {
  if (!getValidAccessToken() || typeof window === "undefined") return null;
  const storedUser = window.localStorage.getItem("user");
  if (!storedUser) return null;

  try {
    const user = JSON.parse(storedUser) as AuthenticatedUser;
    return user?.id && user?.role ? user : null;
  } catch {
    clearStoredSession();
    return null;
  }
}

async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  const token = getValidAccessToken();
  if (!token) throw new ApiError("Please sign in to continue.", 401);

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  if (!response.ok) {
    if (response.status === 401) clearStoredSession();
    const fallback = `Request failed with status ${response.status}`;
    throw new ApiError(await getErrorMessage(response, fallback), response.status);
  }

  return (await response.json()) as T;
}

export async function Login(credentials: LoginRequest): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    let message = `Login failed with status ${response.status}`;

    try {
      const error = (await response.json()) as { message?: string };
      message = error.message ?? message;
    } catch {
      // Keep the status-based fallback when the API does not return JSON.
    }

    throw new ApiError(message, response.status);
  }

  return (await response.json()) as LoginResponse;
}

export async function getBooks(query: BookQuery = {}): Promise<BookPage> {
  const parameters = new URLSearchParams();
  const values: Array<[string, string | number | undefined]> = [
    ["Isbn", query.isbn],
    ["Title", query.title],
    ["Author", query.author],
    ["Category", query.category],
    ["Availability", query.availability],
    ["Page", query.page],
    ["PageSize", query.pageSize],
    ["SortBy", query.sortBy],
    ["SortOrder", query.sortOrder],
  ];

  for (const [key, value] of values) {
    if (value !== undefined && value !== "") parameters.set(key, String(value));
  }

  const search = parameters.size ? `?${parameters.toString()}` : "";
  return apiGet<BookPage>(`/api/books${search}`);
}

export function getBook(id: string): Promise<Book> {
  return apiGet<Book>(`/api/books/${encodeURIComponent(id)}`);
}

export function borrowBook(bookId: string): Promise<BorrowTransaction> {
  const request: BorrowBookRequest = { bookId };
  return apiPost<BorrowTransaction>("/api/borrowings", request);
}

export function borrowBookForUser(bookId: string, userId: string, dueDate?: string): Promise<BorrowTransaction> {
  const request: BorrowBookRequest = { bookId, userId, dueDate: dueDate || null };
  return apiPost<BorrowTransaction>("/api/borrowings", request);
}

export function returnBorrowing(transactionId: string): Promise<BorrowTransaction> {
  return apiPost<BorrowTransaction>(`/api/borrowings/${encodeURIComponent(transactionId)}/return`);
}

function borrowingParameters(query: BorrowingQuery) {
  const parameters = new URLSearchParams();
  if (query.userId) parameters.set("UserId", query.userId);
  if (query.status) parameters.set("Status", query.status);
  if (query.page) parameters.set("Page", String(query.page));
  if (query.pageSize) parameters.set("PageSize", String(query.pageSize));
  return parameters.size ? `?${parameters.toString()}` : "";
}

export function getBorrowings(query: BorrowingQuery = {}): Promise<TransactionPage> {
  return apiGet<TransactionPage>(`/api/borrowings${borrowingParameters(query)}`);
}

export function getMyBorrowings(query: Omit<BorrowingQuery, "userId"> = {}): Promise<TransactionPage> {
  return apiGet<TransactionPage>(`/api/borrowings/mine${borrowingParameters(query)}`);
}

export async function getEndUsers(): Promise<EndUserListItem[]> {
  const response = await apiGet<unknown>("/api/users/end-users");
  return normalizeEndUsers(response);
}

function normalizeEndUsers(response: unknown): EndUserListItem[] {
  const source = Array.isArray(response)
    ? response
    : isRecord(response) && Array.isArray(response.items)
      ? response.items
      : isRecord(response) && Array.isArray(response.$values)
        ? response.$values
        : [];

  return source.flatMap((item) => {
    if (!isRecord(item)) return [];
    const id = typeof item.id === "string"
      ? item.id
      : typeof item.Id === "string"
        ? item.Id
        : "";
    if (!id) return [];
    const username = typeof item.username === "string"
      ? item.username
      : typeof item.Username === "string"
        ? item.Username
        : null;
    return [{ id, username }];
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
