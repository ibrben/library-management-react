import type { LoginRequest, LoginResponse } from "@/types/auth";
import type { Book, BookPage, BookQuery } from "@/types/book";

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
  const token =
    typeof window === "undefined"
      ? null
      : window.localStorage.getItem("accessToken");
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    const fallback = `Request failed with status ${response.status}`;
    throw new ApiError(
      await getErrorMessage(response, fallback),
      response.status,
    );
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
