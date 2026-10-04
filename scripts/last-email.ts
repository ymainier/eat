import "dotenv/config";
import { desc } from "drizzle-orm";
import { createDatabase } from "../src/db/client";
import { emailOutbox } from "../src/db/schema";

// Prints the latest email from the local outbox, e.g. to grab a sign-in link.
const { db, close } = createDatabase(process.env.DATABASE_URL!);
const [email] = await db
  .select()
  .from(emailOutbox)
  .orderBy(desc(emailOutbox.createdAt))
  .limit(1);
await close();
console.log(email ? `To: ${email.to}\nSubject: ${email.subject}\n\n${email.text}` : "Outbox is empty.");
