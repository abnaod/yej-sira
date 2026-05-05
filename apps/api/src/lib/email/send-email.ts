import { getEnv } from "../env";
import { logger } from "../logger";

type SendEmailInput = {
  to: string;
  subject: string;
  text: string;
};

export async function sendEmail(input: SendEmailInput) {
  const env = getEnv();
  const fromName = env.EMAIL_FROM_NAME ?? "Yej-sira";
  const fromEmail = env.EMAIL_FROM ?? "noreply@example.com";

  if (!env.RESEND_API_KEY) {
    logger.info("Email provider not configured; logging email", {
      to: input.to,
      subject: input.subject,
    });
    logger.info(input.text);
    return;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: `${fromName} <${fromEmail}>`,
      to: [input.to],
      subject: input.subject,
      text: input.text,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    logger.error("Failed to send email", {
      status: response.status,
      body,
      to: input.to,
      subject: input.subject,
    });
  }
}
