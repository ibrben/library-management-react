"use client";

import { useRouter } from "next/navigation";
import { useState, type SubmitEvent } from "react";

import { ApiError, Login } from "@/services/api";

export default function LoginPage() {
  const router = useRouter();
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const session = await Login({
        usernameOrEmail: usernameOrEmail.trim(),
        password,
      });

      localStorage.setItem("accessToken", session.accessToken);
      localStorage.setItem("tokenExpiresAt", session.expiresAt);
      localStorage.setItem("user", JSON.stringify(session.user));

      const requestedRoute = new URLSearchParams(window.location.search).get("returnTo");
      const destination = requestedRoute?.startsWith("/") && !requestedRoute.startsWith("//")
        ? requestedRoute
        : "/books";
      router.push(destination);
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMessage(
          error.status === 401
            ? "The username or password you entered is incorrect."
            : error.message,
        );
      } else {
        setErrorMessage(
          "We could not reach the library service. Please try again.",
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#F9F8F6] px-5 py-8 text-[#332C27] sm:px-8 lg:grid lg:grid-cols-[minmax(320px,0.9fr)_minmax(520px,1.1fr)] lg:p-0">
      <section className="relative hidden min-h-screen overflow-hidden bg-[#332C27] px-12 py-14 text-[#F9F8F6] lg:flex lg:flex-col lg:justify-between xl:px-16">
        <div
          className="absolute inset-0 opacity-[0.08]"
          aria-hidden="true"
          style={{
            backgroundImage:
              "linear-gradient(#C9B59C 1px, transparent 1px), linear-gradient(90deg, #C9B59C 1px, transparent 1px)",
            backgroundSize: "72px 72px",
          }}
        />

        <div className="relative flex items-center gap-3">
          <div className="flex size-11 items-center justify-center border border-[#C9B59C]/60 bg-[#F9F8F6]/5 font-serif text-xl">
            L
          </div>
          <div>
            <p className="font-serif text-lg tracking-wide">The Library</p>
            <p className="mt-0.5 text-[10px] uppercase tracking-[0.28em] text-[#C9B59C]">
              Collection &amp; Circulation
            </p>
          </div>
        </div>

        <div className="relative max-w-xl pb-10">
          <div className="mb-7 h-px w-16 bg-[#C9B59C]" />
          <p className="mb-5 text-xs uppercase tracking-[0.32em] text-[#C9B59C]">
            Private access
          </p>
          <h1 className="max-w-lg font-serif text-5xl leading-[1.1] tracking-[-0.025em] xl:text-6xl">
            Every volume has its place.
          </h1>
          <p className="mt-7 max-w-md text-base leading-7 text-[#D9CFC7]">
            Enter the library workspace to manage the collection, serve readers,
            and keep every borrowing record in order.
          </p>
        </div>

        <p className="relative text-xs tracking-wide text-[#C9B59C]">
          Library Management System
        </p>
      </section>

      <section className="flex min-h-[calc(100vh-4rem)] items-center justify-center lg:min-h-screen">
        <div className="w-full max-w-md py-10 sm:py-16">
          <div className="mb-12 flex items-center gap-3 lg:hidden">
            <div className="flex size-10 items-center justify-center bg-[#332C27] font-serif text-lg text-[#F9F8F6]">
              L
            </div>
            <div>
              <p className="font-serif text-lg leading-none">The Library</p>
              <p className="mt-1.5 text-[9px] uppercase tracking-[0.25em] text-[#9A8268]">
                Collection &amp; Circulation
              </p>
            </div>
          </div>

          <div className="mb-9">
            <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.28em] text-[#9A8268]">
              Welcome back
            </p>
            <h2 className="font-serif text-4xl tracking-[-0.02em] text-[#332C27] sm:text-[2.75rem]">
              Sign in to your account
            </h2>
            <p className="mt-4 text-sm leading-6 text-[#6F6258]">
              Use your username or registered email to continue.
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label
                className="mb-2.5 block text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6F6258]"
                htmlFor="usernameOrEmail"
              >
                Username or email
              </label>
              <input
                id="usernameOrEmail"
                name="usernameOrEmail"
                type="text"
                autoComplete="username"
                required
                autoFocus
                value={usernameOrEmail}
                onChange={(event) => setUsernameOrEmail(event.target.value)}
                placeholder="admin or admin@library.local"
                className="h-13 w-full border border-[#D9CFC7] bg-[#F9F8F6] px-4 text-[15px] text-[#332C27] outline-none transition placeholder:text-[#9A8268]/65 focus:border-[#9A8268] focus:ring-2 focus:ring-[#C9B59C]/25"
              />
            </div>

            <div>
              <div className="mb-2.5 flex items-center justify-between">
                <label
                  className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6F6258]"
                  htmlFor="password"
                >
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="text-xs font-medium text-[#6F6258] underline decoration-[#C9B59C] underline-offset-4 transition hover:text-[#332C27]"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                className="h-13 w-full border border-[#D9CFC7] bg-[#F9F8F6] px-4 text-[15px] text-[#332C27] outline-none transition placeholder:text-[#9A8268]/65 focus:border-[#9A8268] focus:ring-2 focus:ring-[#C9B59C]/25"
              />
            </div>

            {errorMessage ? (
              <div
                role="alert"
                aria-live="polite"
                className="border-l-2 border-[#9B4C43] bg-[#9B4C43]/[0.07] px-4 py-3 text-sm leading-5 text-[#7A3832]"
              >
                {errorMessage}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex h-13 w-full items-center justify-center bg-[#332C27] px-5 text-sm font-medium tracking-wide text-[#F9F8F6] transition hover:bg-[#4A4039] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9A8268] disabled:cursor-not-allowed disabled:opacity-65"
            >
              {isSubmitting ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p className="mt-8 border-t border-[#D9CFC7] pt-6 text-center text-xs leading-5 text-[#6F6258]">
            Access is reserved for authorized library staff and members.
          </p>
        </div>
      </section>
    </main>
  );
}
