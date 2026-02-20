import nodemailer from "nodemailer";

type SendOtpEmailParams = {
  to: string;
  otp: string;
};

export class EmailDeliveryError extends Error {
  status: number;
  constructor(message: string, status = 500) {
    super(message);
    this.name = "EmailDeliveryError";
    this.status = status;
  }
}

function parseBool(value: string | undefined, defaultValue: boolean) {
  if (!value) return defaultValue;
  return value.toLowerCase() === "true";
}

function normalizeSmtpError(error: unknown) {
  const message = error instanceof Error ? error.message : "Failed to send OTP email";
  const rawCode =
    typeof error === "object" && error !== null && "code" in error
      ? String((error as { code?: unknown }).code)
      : "";
  const responseCode =
    typeof error === "object" && error !== null && "responseCode" in error
      ? Number((error as { responseCode?: unknown }).responseCode)
      : undefined;

  const lower = message.toLowerCase();
  const isAuthFailure =
    rawCode === "EAUTH" ||
    responseCode === 535 ||
    lower.includes("badcredentials") ||
    lower.includes("username and password not accepted") ||
    lower.includes("invalid login");

  if (isAuthFailure) {
    return {
      status: 502,
      message:
        "Gmail SMTP authentication failed (535). Check GMAIL_SMTP_USER and GMAIL_SMTP_APP_PASSWORD and ensure app password is active for that same Gmail account.",
    };
  }

  return { status: 502, message };
}

export async function sendOtpEmail({ to, otp }: SendOtpEmailParams) {
  const user = process.env.GMAIL_SMTP_USER;
  const pass = process.env.GMAIL_SMTP_APP_PASSWORD;

  if (!user) {
    throw new EmailDeliveryError("GMAIL_SMTP_USER is not configured", 500);
  }
  if (!pass) {
    throw new EmailDeliveryError("GMAIL_SMTP_APP_PASSWORD is not configured", 500);
  }

  const smtpUser = user.trim();
  const smtpPass = pass.replace(/\s+/g, "").trim();
  const senderName = process.env.GMAIL_SMTP_SENDER_NAME || "Coconut CRM";
  const fromEmail = (process.env.GMAIL_SMTP_FROM_EMAIL || smtpUser).trim();
  const appName = process.env.APP_NAME || "Coconut CRM";
  const host = process.env.GMAIL_SMTP_HOST || "smtp.gmail.com";
  const port = Number(process.env.GMAIL_SMTP_PORT || 465);
  const secure = parseBool(process.env.GMAIL_SMTP_SECURE, true);
  const rejectUnauthorized = parseBool(
    process.env.GMAIL_SMTP_TLS_REJECT_UNAUTHORIZED,
    true
  );
  const isProduction = process.env.NODE_ENV === "production";

  if (!smtpUser.includes("@")) {
    throw new EmailDeliveryError("GMAIL_SMTP_USER must be a valid email address", 500);
  }
  if (!fromEmail.includes("@")) {
    throw new EmailDeliveryError("GMAIL_SMTP_FROM_EMAIL must be a valid email address", 500);
  }
  if (isProduction && !rejectUnauthorized) {
    throw new EmailDeliveryError(
      "In production, GMAIL_SMTP_TLS_REJECT_UNAUTHORIZED must be true",
      500
    );
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
    tls: {
      rejectUnauthorized,
    },
  });

  try {
    await transporter.sendMail({
      from: `"${senderName}" <${fromEmail}>`,
      to,
      subject: `${appName} admin password reset OTP`,
      html: `<p>Your OTP for admin password reset is <b>${otp}</b>.</p><p>This OTP expires in 10 minutes.</p>`,
      text: `Your OTP for admin password reset is ${otp}. It expires in 10 minutes.`,
    });
  } catch (error: unknown) {
    const normalized = normalizeSmtpError(error);
    throw new EmailDeliveryError(normalized.message, normalized.status);
  }
}
