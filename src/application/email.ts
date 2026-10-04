export type Email = { to: string; subject: string; text: string };

export interface EmailSender {
  send(email: Email): Promise<void>;
}
