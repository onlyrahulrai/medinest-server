import bcrypt from "bcryptjs";
import { Queue } from "bullmq";
import jwt from "jsonwebtoken";
import { generateToken } from "../helper/utils/common";
import { EditProfileInput } from "../types/schema/Auth";
import User from "../models/User";
import Role from "../models/Role";
import { TokenBlacklist } from "../models/TokenBlacklist";
import { v4 as uuidV4 } from "uuid";
import OTPGenerator from "otp-generator";
import OTP from "../models/OTP";

const myCommonQueue = new Queue("SS-CommonTask");

/**
 * Send OTP to a phone number for login.
 * Auto-creates the user if they don't exist (mobile-first signup).
 */
export const sendPhoneOtp = async (phone?: string) => {
  try {
    // Check if user exists; if not, auto-create one
    let user = await User.findOne({ phone });

    if (!user) {
      const role = await Role.findOne({ name: "User" });
      if (!role) throw new Error("Default role 'User' not found");

      const randomPassword = await bcrypt.hash(uuidV4(), 10);

      user = await new User({
        name: "",
        phone,
        password: randomPassword,
        isPhoneVerified: false,
        roles: [role._id],
      }).save();
    }

    let otp = "123456";

    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    if (process.env.DEBUG === "false") {
      otp = await OTPGenerator.generate(6, {
        upperCaseAlphabets: false,
        lowerCaseAlphabets: false,
        specialChars: false,
      });

      await myCommonQueue.add("send-verification-otp", {
        otp,
        contacts: `${phone}`,
      });
    }

    // Hash OTP before saving
    const hashedOtp = await bcrypt.hash(otp, 10);

    await OTP.findOneAndUpdate(
      { identifier: phone, type: "login" },
      { otp: hashedOtp, expiresAt: otpExpiresAt, attempts: 0 },
      { upsert: true, new: true }
    );

    return { message: "Verification OTP has been sent" };
  } catch (error: any) {
    throw new Error(error.message || "Failed to send Verification OTP");
  }
};

/**
 * Verify OTP and log the user in.
 * Returns user data with access and refresh tokens.
 */
export const loginWithOtp = async (phone: string, otp: string) => {
  try {
    const user = await User.findOne({ phone }).populate([
      {
        path: "roles",
        select: "name",
      },
    ]);

    if (!user) {
      throw new Error("No account associated with this phone number.");
    }

    // Find the current OTP record
    const otpRecord = await OTP.findOne({ identifier: phone, type: "login" });

    if (!otpRecord) {
      throw new Error("OTP has expired or doesn't exist. Please request a new one.");
    }

    if (otpRecord.attempts >= 5) {
      throw new Error("Too many failed attempts. Please request a new OTP.");
    }

    const isValid = await bcrypt.compare(otp, otpRecord.otp);

    if (!isValid) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      throw new Error("Invalid OTP");
    }

    // Delete the OTP record once verified
    await OTP.deleteOne({ _id: otpRecord._id });

    // Auto-verify phone number on successful OTP login
    if (!user.isPhoneVerified) {
      user.isPhoneVerified = true;
      await user.save();
    }

    const payload = {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      roles: user.roles,
    };

    const access = generateToken(payload, "24h");
    const refresh = generateToken(payload, "7d");

    const { password: userPassword, __v, ...userData } = user.toObject();

    return { ...userData, access, refresh };
  } catch (error: any) {
    throw new Error(error.message || "OTP Login failed");
  }
};

/**
 * Get user details by ID.
 */
export const getUserDetails = async (userId: string) => {
  try {
    const user = await User.findById(userId).select("-password -__v").populate({
      path: "roles",
      select: "name",
    });

    if (!user) {
      throw new Error("We couldn't find an account matching those details.");
    }

    return user.toObject();
  } catch (error: any) {
    throw new Error(error.message || "Failed to fetch user details");
  }
};

/**
 * Edit user profile (name, email, phone, etc.).
 * Returns updated user data with fresh tokens.
 */
export const editUserProfile = async (_id: string, data: EditProfileInput) => {
  try {
    const updateData: any = { ...data };

    if (data.phone) {
      updateData.isPhoneVerified = true;
    }

    const user = await User.findByIdAndUpdate(_id, { $set: updateData }, { new: true }).select("-password -__v").populate([
      {
        path: "roles",
        select: "name",
      },
    ]);

    if (!user) {
      throw new Error("User not found");
    }

    const payload = {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      roles: user.roles,
    };

    const access = generateToken(payload, "24h");
    const refresh = generateToken(payload, "7d");

    return { ...user.toObject(), access, refresh };
  } catch (error: any) {
    throw new Error(error.message || "Failed to edit user profile");
  }
};

/**
 * Logout by blacklisting the current JWT token.
 */
export const logout = async (req: any) => {
  try {
    const authHeader = req.headers["authorization"];
    if (!authHeader) throw new Error("No token provided");

    const token = authHeader.split(" ")[1];
    if (!token) throw new Error("Invalid token format");

    const decoded: any = jwt.decode(token);
    if (!decoded || !decoded.exp) throw new Error("Invalid token");

    await TokenBlacklist.create({
      token,
      user: decoded._id || undefined,
      reason: "LOGOUT",
      expiresAt: new Date(decoded.exp * 1000),
    });
  } catch (error) {
    console.error("Logout service error:", error);
    throw error;
  }
};