import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import connectDB from "@/app/config/mongodbconnection";
import User from "@/app/models/user";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { email, code, newPassword } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { success: false, message: "Email is required." },
        { status: 400 }
      );
    }

    if (!code || typeof code !== "string" || !/^\d{6}$/.test(code.trim())) {
      return NextResponse.json(
        { success: false, message: "A valid 6-digit reset code is required." },
        { status: 400 }
      );
    }

    if (!newPassword || typeof newPassword !== "string" || newPassword.length < 8) {
      return NextResponse.json(
        { success: false, message: "New password must be at least 8 characters long." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "No account found with this email." },
        { status: 404 }
      );
    }

    if (!user.resetPasswordExpiry || user.resetPasswordExpiry.getTime() < Date.now()) {
      return NextResponse.json(
        { success: false, message: "The reset code has expired. Please request a new one." },
        { status: 400 }
      );
    }

    const codeHash = crypto
      .createHash("sha256")
      .update(code.trim())
      .digest("hex");

    if (codeHash !== user.resetPasswordCodeHash) {
      return NextResponse.json(
        { success: false, message: "Invalid reset code." },
        { status: 400 }
      );
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.resetPasswordCodeHash = undefined;
    user.resetPasswordExpiry = undefined;
    user.verified = true; // Email is confirmed by reset code

    await user.save();

    return NextResponse.json(
      {
        success: true,
        message: "Password has been successfully reset. You can now log in.",
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
          : "An error occurred while resetting your password. Please try again.",
      },
      { status: isDbConfigError ? 503 : 500 }
    );
  }
}
