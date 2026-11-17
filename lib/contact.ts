export const CONTACT_LIMITS = {
  nameMaxLength: 80,
  emailMaxLength: 254,
  messageMaxLength: 2000,
} as const;

export type ContactMessageInput = {
  name: string;
  email: string;
  message: string;
  website: string; // honeypot, always "" for real visitors
};

export type ContactFieldName = "name" | "email" | "message";

export type SendContactMessageResult =
  | { status: "success"; senderName: string }
  | { status: "invalid"; invalidFields: ContactFieldName[] }
  | { status: "failed" }; // Resend rejected the email or the server is misconfigured

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidText(value: string, maxLength: number) {
  const trimmedValue = value.trim();
  return trimmedValue.length > 0 && trimmedValue.length <= maxLength;
}

export function validateContactMessage(input: ContactMessageInput): ContactFieldName[] {
  const invalidFields: ContactFieldName[] = [];

  if (!isValidText(input.name, CONTACT_LIMITS.nameMaxLength)) {
    invalidFields.push("name");
  }

  const trimmedEmail = input.email.trim();
  if (!isValidText(trimmedEmail, CONTACT_LIMITS.emailMaxLength) || !EMAIL_PATTERN.test(trimmedEmail)) {
    invalidFields.push("email");
  }

  if (!isValidText(input.message, CONTACT_LIMITS.messageMaxLength)) {
    invalidFields.push("message");
  }

  return invalidFields;
}
