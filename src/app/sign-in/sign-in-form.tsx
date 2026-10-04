"use client";

import { useActionState } from "react";
import { requestSignInLink, type SignInState } from "./actions";

export function SignInForm() {
  const [state, action, pending] = useActionState<SignInState, FormData>(
    requestSignInLink,
    { status: "idle" },
  );

  if (state.status === "sent") {
    return (
      <p role="status">
        Check your email: we sent a sign-in link to <strong>{state.email}</strong>.
      </p>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-3">
      <label className="flex flex-col gap-1">
        Email
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          defaultValue={state.status === "not-allowed" ? state.email : ""}
          className="rounded border border-zinc-300 px-3 py-2"
        />
      </label>
      {state.status === "not-allowed" && (
        <p role="alert" className="text-red-700">
          You can&apos;t sign in to Eat with {state.email}. Ask a Member to add it to
          the allow list.
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-zinc-900 px-3 py-2 text-white disabled:opacity-50"
      >
        Email me a sign-in link
      </button>
    </form>
  );
}
