import { NextRequest, NextResponse } from "next/server";

const AI_BASE_URL = process.env.AI_BASE_URL || "https://chatbot-livid-gamma-59.vercel.app";
const AI_CHAT_ENDPOINT = process.env.AI_CHAT_ENDPOINT || `${AI_BASE_URL}/ai/chat`;

interface AIChatPayload {
  message: string;
}

export async function POST(req: NextRequest) {
  let body: AIChatPayload;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body." },
      { status: 400 }
    );
  }

  const message = body?.message?.trim();

  if (!message) {
    return NextResponse.json(
      { success: false, error: "Message is required." },
      { status: 400 }
    );
  }

  try {
    const upstream = await fetch(AI_CHAT_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message }),
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