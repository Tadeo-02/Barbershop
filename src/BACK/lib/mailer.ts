import { Resend } from "resend";
import logger from "./logger";

type SendMailParams = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export const sendMail = async ({ to, subject, text, html }: SendMailParams) => {
  if (!resend) {
    logger.warn({ to, subject }, "Email transport not configured. Skipping email send.");
    return;
  }

  await resend.emails.send({
    from: process.env.MAIL_FROM || "onboarding@resend.dev",
    to,
    subject,
    text,
    html,
  });
};

export const buildVerificationEmail = (name: string, verificationUrl: string) => {
  const subject = "Verifica tu cuenta de Barbershop";
  const text = [
    `Hola ${name},`,
    "",
    "Para activar tu cuenta, verificá tu email con este enlace:",
    verificationUrl,
    "",
    "Si no creaste esta cuenta, podés ignorar este mensaje.",
  ].join("\n");

  const html = `
    <p>Hola ${name},</p>
    <p>Para activar tu cuenta, verificá tu email con este enlace:</p>
    <p><a href="${verificationUrl}">Verificar cuenta</a></p>
    <p>Si no creaste esta cuenta, podés ignorar este mensaje.</p>
  `;

  return { subject, text, html };
};

export const buildResetPasswordEmail = (name: string, resetUrl: string) => {
  const subject = "Recuperación de contraseña - Barbershop";
  const text = [
    `Hola ${name},`,
    "",
    "Recibimos una solicitud para restablecer tu contraseña.",
    "Usá este enlace para continuar:",
    resetUrl,
    "",
    "Si no hiciste esta solicitud, ignorá este mensaje.",
  ].join("\n");

  const html = `
    <p>Hola ${name},</p>
    <p>Recibimos una solicitud para restablecer tu contraseña.</p>
    <p>Usá este enlace para continuar:</p>
    <p><a href="${resetUrl}">Restablecer contraseña</a></p>
    <p>Si no hiciste esta solicitud, ignorá este mensaje.</p>
  `;

  return { subject, text, html };
};
