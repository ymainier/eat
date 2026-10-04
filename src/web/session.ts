import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { Member } from "../application";
import { application, auth } from "./application";

/**
 * The signed-in Member; redirects to sign-in when there is none.
 * On first sign-in the person joins the Household here, so a failed attempt
 * is retried on the next request rather than leaving them without a Membership.
 */
export async function requireMember(): Promise<Member> {
  // Reading the request first makes every signed-in page render per request,
  // never at build time.
  const requestHeaders = await headers();
  const session = await auth().api.getSession({ headers: requestHeaders });
  if (!session) redirect("/sign-in");
  const app = application();
  const identity = { userId: session.user.id, email: session.user.email };
  const member = await app.findMember(identity);
  if (member) return member;
  if (!app.isAllowedToSignIn(identity.email)) {
    redirect("/sign-in?error=not-a-member");
  }
  return app.joinHousehold(identity);
}
