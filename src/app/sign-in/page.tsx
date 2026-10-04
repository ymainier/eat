import { SignInForm } from "./sign-in-form";

// Better Auth redirects here with its own error code when a magic link fails.
const errors: Record<string, string> = {
  not_allowed: "This email can't sign in to Eat.",
  "not-a-member": "This email can't sign in to Eat.",
};
const linkFailed =
  "That sign-in link didn't work: it may have expired or been used already. Ask for a new one.";

export default async function SignInPage({
  searchParams,
}: PageProps<"/sign-in">) {
  const { error } = await searchParams;
  const message =
    typeof error === "string" ? (errors[error] ?? linkFailed) : undefined;

  return (
    <main className="mx-auto flex w-full max-w-sm flex-col gap-6 p-4 pt-16">
      <h1 className="text-2xl font-semibold">Sign in to Eat</h1>
      {message && (
        <p role="alert" className="text-red-700">
          {message}
        </p>
      )}
      <SignInForm />
    </main>
  );
}
