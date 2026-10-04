import { afterAll, beforeEach } from "vitest";
import { createDatabase } from "../db/client";
import { truncateAll } from "../db/testing";

export const testDatabaseUrl =
  process.env.TEST_UNIT_DATABASE_URL ??
  "postgres://eat:eat@localhost:5432/eat_test_unit";

/** A connection to eat_test_unit, emptied before each test. */
export function setUpTestDatabase() {
  const { db, close } = createDatabase(testDatabaseUrl);
  beforeEach(() => truncateAll(db));
  afterAll(close);
  return db;
}
