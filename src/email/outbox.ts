import type { EmailSender } from "../application/email";
import type { Database } from "../db/client";
import { emailOutbox } from "../db/schema";

/** Stores emails in the database instead of sending them; for tests and local development. */
export function outboxEmailSender(db: Database): EmailSender {
  return {
    async send(email) {
      await db.insert(emailOutbox).values(email);
    },
  };
}
