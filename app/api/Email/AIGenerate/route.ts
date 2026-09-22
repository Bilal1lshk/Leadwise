import { NextRequest, NextResponse } from "next/server";

const AI_BASE_URL = process.env.AI_BASE_URL || "https://chatbot-livid-gamma-59.vercel.app";
const AI_EMAIL_ENDPOINT = process.env.AI_EMAIL_ENDPOINT || `${AI_BASE_URL}/ai/email`;

interface AIEmailPayload {
  lead_name: string;
  lead_email: string;
  company?: string | null;
  status?: string | null;
  source?: string | null;
  estimated_value?: number | null;
  notes?: string | null;
  goal: string;
  tone?: string;
  sender_name?: string | null;
  extra_instructions?: string | null;
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(req: NextRequest) {
  let body: AIEmailPayload;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body." },
      { status: 400 }
    );
  }

  const leadName = body?.lead_name?.trim();
  const leadEmail = body?.lead_email?.trim();
  const goal = body?.goal?.trim();

  if (!leadName) {
    return NextResponse.json(
      { success: false, error: "lead_name is required." },
      { status: 400 }
    );
  }

  if (!leadEmail || !isValidEmail(leadEmail)) {
    return NextResponse.json(
      { success: false, error: "A valid lead_email is required." },
      { status: 400 }
    );
  }

  if (!goal) {
    return NextResponse.json(
      { success: false, error: "goal is required." },
      { status: 400 }
    );
  }

  const payload: AIEmailPayload = {
    lead_name: leadName,
    lead_email: leadEmail,
    company: body.company?.trim() || null,
    status: body.status?.trim() || null,
    source: body.source?.trim() || null,
    estimated_value:
      typeof body.estimated_value === "number" && !Number.isNaN(body.estimated_value)
        ? body.estimated_value
        : null,
    notes: body.notes?.trim() || null,
    goal,
    tone: body.tone?.trim() || "professional but warm",
    sender_name: body.sender_name?.trim() || null,
    extra_instructions: body.extra_instructions?.trim() || null,
  };

  try {
    const upstream = await fetch(AI_EMAIL_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const text = await upstream.text();

    if (!upstream.ok) {
      return NextResponse.json(
        { success: false, error: `AI service responded with ${upstream.status}.` },
        { status: upstream.status }
      );
    }

    try {
      const json = JSON.parse(text);
      return NextResponse.json(json);
    } catch {
      return NextResponse.json({ success: true, response: text });
    }
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Something went wrong.";
    return NextResponse.json(
      { success: false, error: `Failed to reach AI service: ${message}` },
      { status: 502 }
    );
  }
}