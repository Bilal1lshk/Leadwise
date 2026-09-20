import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

// ---- Payload shape sent from SendEmailModal.tsx ----
interface SendEmailPayload {
  smtp: {
    host: string;
    port: number;
    secure: boolean;
    user: string; // Gmail address
    pass: string; // Google App Password
  };
  from: {
    name: string;
    email: string;
  };
  replyTo?: string;
  to: string; // comma-separated list of recipients
  cc?: string;
  bcc?: string;
  subject: string;
  html: string; // rendered body (with signature appended)
  text?: string; // optional plain-text fallback
}

function splitAddresses(value?: string): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(req: NextRequest) {
  let body: SendEmailPayload;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body." },
      { status: 400 }
    );
  }

  const { smtp, from, replyTo, to, cc, bcc, subject, html, text } = body || {};

  // ---- Validation ----
  if (!smtp?.user || !smtp?.pass) {
    return NextResponse.json(
      { success: false, error: "Missing SMTP credentials (user/app password)." },
      { status: 400 }
    );
  }

  if (!from?.email || !isValidEmail(from.email)) {
    return NextResponse.json(
      { success: false, error: "Missing or invalid sender email." },
      { status: 400 }
    );
  }

  const toList = splitAddresses(to);
  if (toList.length === 0 || !toList.every(isValidEmail)) {
    return NextResponse.json(
      { success: false, error: "Missing or invalid recipient(s) in 'to'." },
      { status: 400 }
    );
  }

  if (!subject?.trim()) {
    return NextResponse.json(
      { success: false, error: "Subject is required." },
      { status: 400 }
    );
  }

  if (!html?.trim() && !text?.trim()) {
    return NextResponse.json(
      { success: false, error: "Email body is required." },
      { status: 400 }
    );
  }

  try {
    const transporter = nodemailer.createTransport({
      host: smtp.host || "smtp.gmail.com",
      port: smtp.port || 465,
      secure: smtp.secure ?? true, // true for 465, false for 587 (STARTTLS)
      auth: {
        user: smtp.user,
        pass: smtp.pass,
      },
    });

    // Verify credentials/connection before attempting to send
    await transporter.verify();

    const info = await transporter.sendMail({
      from: `"${from.name}" <${from.email}>`,
      to: toList.join(", "),
      cc: splitAddresses(cc).join(", ") || undefined,
      bcc: splitAddresses(bcc).join(", ") || undefined,
      replyTo: replyTo?.trim() || undefined,
      subject: subject.trim(),
      html: html?.trim() || undefined,
      text: text?.trim() || undefined,
    });

    return NextResponse.json({
      success: true,
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected,
    });
  } catch (err: any) {
    console.error("SMTP send error:", err);

    // Surface common Gmail auth failure clearly
    const message =
      err?.responseCode === 535
        ? "Gmail rejected the credentials. Check that the App Password is correct and 2-Step Verification is enabled."
        : err?.message || "Failed to send email.";

    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}