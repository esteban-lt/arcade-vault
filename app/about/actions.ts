"use server";

import { Resend } from "resend";
import {
  validateContactMessage,
  type ContactMessageInput,
  type SendContactMessageResult,
} from "@/lib/contact";

export async function sendContactMessage(
  input: ContactMessageInput,
): Promise<SendContactMessageResult> {
  const senderName = String(input?.name ?? "").trim();

  // Honeypot: real visitors never see this field. Pretend success so bots learn nothing.
  if (String(input?.website ?? "").trim() !== "") {
    return { status: "success", senderName };
  }

  const invalidFields = validateContactMessage({
    name: String(input?.name ?? ""),
    email: String(input?.email ?? ""),
    message: String(input?.message ?? ""),
    website: "",
  });
  if (invalidFields.length > 0) {
    return { status: "invalid", invalidFields };
  }

  const apiKey = process.env.RESEND_API_KEY;
  const toEmail = process.env.CONTACT_TO_EMAIL;
  const fromEmail = process.env.CONTACT_FROM_EMAIL;
  if (!apiKey || !toEmail || !fromEmail) {
    console.error("Contact email is not configured: missing Resend environment variables.");
    return { status: "failed" };
  }

  const senderEmail = input.email.trim();
  const subjectName = senderName.replace(/[\r\n]+/g, " ");

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: fromEmail,
      to: toEmail,
      replyTo: senderEmail,
      subject: `[Arcade Vault] Mensaje de ${subjectName}`,
      text: `Nombre: ${subjectName}\nCorreo: ${senderEmail}\n\n${input.message.trim()}`,
    });

    if (error) {
      console.error("Resend rejected the contact email:", error);
      return { status: "failed" };
    }
  } catch (error) {
    console.error("Sending the contact email failed:", error);
    return { status: "failed" };
  }

  return { status: "success", senderName };
}
