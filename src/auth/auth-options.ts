import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { magicLink } from "better-auth/plugins";
import type { BetterAuthOptions } from "better-auth";
import type { Application } from "../application";
import type { Database } from "../db/client";
import * as schema from "../db/schema";

/**
 * Better Auth configuration shared by the web app and the e2e session helper.
 * Clients add their own plugins (e.g. Next.js cookies, test utilities).
 */
export function authOptions(deps: {
  db: Database;
  application: Application;
  baseURL: string;
  secret: string;
}) {
  const { application } = deps;
  return {
    baseURL: deps.baseURL,
    secret: deps.secret,
    database: drizzleAdapter(deps.db, { provider: "pg", schema }),
    user: {
      validateUserInfo: ({ user }) =>
        user.email && application.isAllowedToSignIn(user.email)
          ? undefined
          : { error: "not_allowed", errorDescription: "This email can't sign in to Eat." },
    },
    plugins: [
      magicLink({
        sendMagicLink: ({ email, url }) =>
          application.sendSignInLink({ email, url }),
      }),
    ],
  } satisfies BetterAuthOptions;
}
