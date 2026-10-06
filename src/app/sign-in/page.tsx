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
    <div className="ruled flex flex-1 flex-col">
      <main className="mx-auto flex w-full max-w-sm flex-1 flex-col px-6 pb-10 sm:justify-center">
        <div className="flex flex-1 flex-col justify-center gap-1.5 pt-10 pb-8 sm:flex-none">
          <p className="font-display text-[64px] leading-none font-bold text-pen">Eat</p>
          <p className="font-hand text-3xl leading-tight font-semibold text-ink-soft">
            what’s for dinner this week?
          </p>
        </div>
        <section className="card flex flex-col gap-3.5 px-4.5 pt-5.5 pb-4.5">
          <h1 className="font-display text-[22px] font-bold">Sign in to Eat</h1>
          {message && (
            <p role="alert" className="font-medium text-danger">
              {message}
            </p>
          )}
          <SignInForm />
        </section>
      </main>
    </div>
  );
}
