export type EmailMessage = {
  to: string;
  subject: string;
  /** Plain-text body. Always provide one — some clients never render HTML. */
  text: string;
  /** Optional HTML body. */
  html?: string;
  from?: string;
  replyTo?: string;
};

export type SendResult = {
  ok: boolean;
  driver: string;
  /** Provider message id, when the provider returns one. */
  id?: string;
  error?: string;
};

export type EmailDriver = {
  name: string;
  send(message: EmailMessage & { from: string }): Promise<SendResult>;
};
