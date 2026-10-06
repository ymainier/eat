"use client";

import { useActionState } from "react";
import { MailIcon } from "../icons";
import { requestSignInLink, type SignInState } from "./actions";

export function SignInForm() {
  const [state, action, pending] = useActionState<SignInState, FormData>(
    requestSignInLink,
    { status: "idle" },
  );

  if (state.status === "sent") {
    return (
      <div role="status" className="flex flex-col gap-3">
        <span className="grid size-12 place-items-center rounded-full bg-pen-wash text-pen">
          <MailIcon />
        </span>
        <p className="font-display text-xl font-bold">Check your email</p>
        <p className="leading-normal">
          We sent a sign-in link to <strong>{state.email}</strong>. Open it on this device to get
          back to the kitchen.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-3.5">
      <label className="label flex flex-col gap-2">
        Email
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          defaultValue={state.status === "not-allowed" ? state.email : ""}
          className="field font-normal text-ink"
        />
      </label>
      {state.status === "not-allowed" && (
        <p role="alert" className="font-medium text-danger">
          You can&apos;t sign in to Eat with {state.email}. Ask a Member to add it to the allow
          list.
        </p>
      )}
      <button type="submit" disabled={pending} className="btn btn-pen">
        Email me a sign-in link
      </button>
      <p className="text-sm leading-relaxed text-ink-soft">
        Only emails on the Household&apos;s allow list can sign in.
      </p>
    </form>
  );
}
