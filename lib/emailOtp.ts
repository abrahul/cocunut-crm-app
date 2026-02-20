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

export async function sendOtpEmail({ to, otp }: SendOtpEmailParams) {
  const user = process.env.GMAIL_SMTP_USER;
  const pass = process.env.GMAIL_SMTP_APP_PASSWORD;

  if (!user) {
    throw new EmailDeliveryError("GMAIL_SMTP_USER is not configured", 500);
  }
  if (!pass) {
    throw new EmailDeliveryError("GMAIL_SMTP_APP_PASSWORD is not configured", 500);
  }

  const senderName = process.env.GMAIL_SMTP_SENDER_NAME || "Coconut CRM";
  const fromEmail = process.env.GMAIL_SMTP_FROM_EMAIL || user;
  const appName = process.env.APP_NAME || "Coconut CRM";

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user,
      pass,
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
    const message = error instanceof Error ? error.message : "Failed to send OTP email";
    throw new EmailDeliveryError(
      message,
      502
    );
  }
}
