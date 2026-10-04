"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { application, auth } from "@/web/application";

export type SignInState =
  | { status: "idle" }
  | { status: "sent"; email: string }
  | { status: "not-allowed"; email: string };

export async function requestSignInLink(
  _previous: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!application().isAllowedToSignIn(email)) {
    return { status: "not-allowed", email };
  }
  await auth().api.signInMagicLink({
    body: { email, callbackURL: "/", errorCallbackURL: "/sign-in" },
    headers: await headers(),
  });
  return { status: "sent", email };
}

export async function signOut() {
  await auth().api.signOut({ headers: await headers() });
  redirect("/sign-in");
}
