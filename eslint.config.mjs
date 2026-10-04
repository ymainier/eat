import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    ".next-e2e/**",
    "test-results/**",
    "playwright-report/**",
  ]),
  {
    // Playwright fixtures call `use`, which is not a React hook.
    files: ["e2e/**"],
    rules: { "react-hooks/rules-of-hooks": "off" },
  },
  {
    // ADR-0002: the domain and application layers know nothing of their clients.
    files: ["src/domain/**", "src/application/**", "src/db/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            { group: ["next", "next/*", "react", "react/*", "react-dom", "react-dom/*"], message: "Keep the core independent of Next.js and React (ADR-0002)." },
            { group: ["@/app/*", "@/web/*", "**/app/*", "**/web/*"], message: "The core must not depend on its clients (ADR-0002)." },
          ],
        },
      ],
    },
  },
]);

export default eslintConfig;
