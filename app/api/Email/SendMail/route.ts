import { NextResponse } from "next/server";
import crypto from "crypto";
import { sendEmail } from "@/app/lib/mailer";
import connectDB from "@/app/config/mongodbconnection";
import User from "@/app/models/user";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    console.log(email)
    if (!email) {
      return NextResponse.json(
        { success: false, message: "Email is required." },
        { status: 400 },
      );
    }

    await connectDB();
    const user = await User.findOne({ email });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "No account was found for this email." },
        { status: 404 },
      );
    }

    if (user.verified) {
      return NextResponse.json(
        { success: false, message: "This email is already verified." },
        { status: 400 },
      );
    }

    const verificationCode = crypto.randomInt(100000, 1000000).toString();
    user.verificationCodeHash = crypto
      .createHash("sha256")
      .update(verificationCode)
      .digest("hex");
    user.verificationCodeExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    const info = await sendEmail({
      to: email,
      subject: "Verify your Leadwise account",
      text: `Your Leadwise verification code is ${verificationCode}. It expires in 10 minutes.`,
      html: `<p>Your Leadwise verification code is:</p><p style="font-size: 24px; font-weight: 700; letter-spacing: 6px">${verificationCode}</p><p>This code expires in 10 minutes.</p>`,
    });

    return NextResponse.json({
      success: true,
      message: "Verification code sent.",
      messageId: info.messageId,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}