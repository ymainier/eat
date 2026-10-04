import type { EmailSender } from "../application/email";

export function resendEmailSender(options: {
  apiKey: string;
  from: string;
}): EmailSender {
  return {
    async send(email) {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${options.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ from: options.from, ...email }),
      });
      if (!response.ok) {
        throw new Error(
          `Resend refused the email (${response.status}): ${await response.text()}`,
        );
      }
    },
  };
}
