import { eq } from "drizzle-orm";
import type { Database } from "../db/client";
import { members } from "../db/schema";

/** The Member a use case acts on behalf of; it scopes everything to their Household. */
export type Member = { id: string; householdId: string };

export async function findMember(
  db: Database,
  input: { userId: string },
): Promise<Member | null> {
  const [row] = await db
    .select({ id: members.id, householdId: members.householdId })
    .from(members)
    .where(eq(members.userId, input.userId));
  return row ?? null;
}
