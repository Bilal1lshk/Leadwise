import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import connectDB from "@/app/config/mongodbconnection";
import User from "@/app/models/user";
import { sendPasswordResetEmail } from "@/app/lib/mailer";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        {
          success: false,
          message: "Email is required",
        },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "No account found with this email address",
        },
        { status: 404 }
      );
    }

    // Generate 6-digit numeric reset code
    const resetCode = crypto.randomInt(100000, 1000000).toString();
    const resetPasswordCodeHash = crypto
      .createHash("sha256")
      .update(resetCode)
      .digest("hex");

    // 10 minutes expiration
    user.resetPasswordCodeHash = resetPasswordCodeHash;
    user.resetPasswordExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    try {
      await sendPasswordResetEmail(normalizedEmail, resetCode);
    } catch (mailError) {
      return NextResponse.json(
        {
          success: false,
          message: "Failed to send reset email. Please try again later or check SMTP settings.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Password reset code has been sent to your email.",
      },
      { status: 200 }
    );
  } catch (error) {
    const isDbConfigError =
      error instanceof Error && error.message.includes("Missing MongoDB connection string");

    return NextResponse.json(
      {
        success: false,
        message: isDbConfigError
          ? "Database connection is not configured"
          : "An unexpected error occurred. Please try again.",
      },
      { status: isDbConfigError ? 503 : 500 }
    );
  }
}
