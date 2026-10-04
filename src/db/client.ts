import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export type Database = ReturnType<typeof createDatabase>["db"];

export function createDatabase(url: string) {
  const client = postgres(url, { onnotice: () => {} });
  return {
    db: drizzle(client, { schema }),
    close: () => client.end(),
  };
}

export type Transaction = Parameters<Parameters<Database["transaction"]>[0]>[0];
/** Either the database or an open transaction. */
export type Executor = Database | Transaction;
