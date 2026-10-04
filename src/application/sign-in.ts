import { households, members } from "../db/schema";
import type { Database } from "../db/client";
import type { EmailSender } from "./email";
import { findMember, type Member } from "./members";

export class NotAllowedToSignInError extends Error {
  constructor(email: string) {
    super(`${email} is not on the allow list`);
  }
}

export type AllowList = readonly string[];

const normalise = (email: string) => email.trim().toLowerCase();

export function isAllowedToSignIn(allowList: AllowList, email: string) {
  return allowList.some((allowed) => normalise(allowed) === normalise(email));
}

export async function sendSignInLink(
  deps: { emailSender: EmailSender; allowList: AllowList },
  input: { email: string; url: string },
) {
  if (!isAllowedToSignIn(deps.allowList, input.email)) {
    throw new NotAllowedToSignInError(input.email);
  }
  await deps.emailSender.send({
    to: input.email,
    subject: "Sign in to Eat",
    text: `Open this link to sign in to Eat:\n\n${input.url}\n\nIt expires in 5 minutes. If you didn't ask to sign in, ignore this email.`,
  });
}

/**
 * Makes the person signing in a Member of the Household, the first time only.
 * v1 runs a single Household, so that is the one they join.
 */
export async function joinHousehold(
  deps: { db: Database; allowList: AllowList },
  input: { userId: string; email: string },
): Promise<Member> {
  if (!isAllowedToSignIn(deps.allowList, input.email)) {
    throw new NotAllowedToSignInError(input.email);
  }
  const [household] = await deps.db
    .select({ id: households.id })
    .from(households)
    .limit(1);
  if (!household) throw new Error("No Household exists yet; run the seed");
  await deps.db
    .insert(members)
    .values({ householdId: household.id, userId: input.userId })
    .onConflictDoNothing({ target: members.userId });
  const member = await findMember(deps.db, input);
  if (!member) throw new Error(`Membership for ${input.userId} was not created`);
  return member;
}
