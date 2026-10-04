import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/web/application";

export const { GET, POST } = toNextJsHandler((request: Request) =>
  auth().handler(request),
);
