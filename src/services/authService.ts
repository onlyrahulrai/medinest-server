import bcrypt from "bcryptjs";
import { Queue } from "bullmq";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { generateToken } from "../helper/utils/common";
import { CaregiverInvitationStatusInput, CaregiverLookupResponse, EditProfileInput, OnboardingCaregiverInput, SaveOnboardingProfileInput } from "../types/schema/Auth";
import { emitToUser } from "../helper/utils/socket";
import User from "../models/User";
import CaregiverInvitation from "../models/CaregiverInvitation";
import Role from "../models/Role";
import { TokenBlacklist } from "../models/TokenBlacklist";
import OTPGenerator from "otp-generator";
import OTP from "../models/OTP";

const myCommonQueue = new Queue("SS-CommonTask");

const normalizePhone = (phone?: string) => phone?.replace(/\D/g, "") ?? "";
const ACTIVE_INVITE_STATUSES = ["pending_invite", "invite_sent", "accepted"] as const;

const buildOnboardingStep = (data: SaveOnboardingProfileInput) => {
  if (data.isOnboardingCompleted) {
    return 4;
  }

  if (typeof data.onboardingStep === "number") {
    return Math.min(Math.max(data.onboardingStep, 1), 4);
  }

  return undefined;
};

const buildConflictQuery = (currentUserId: string, phoneNumber: string) => ({
  _id: { $ne: currentUserId },
  caregiverContacts: {
    $elemMatch: {
      phoneNumber,
      inviteStatus: { $in: [...ACTIVE_INVITE_STATUSES] },
    },
  },
});

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

      user = await new User({
        name: "",
        phone,
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

    const { __v, ...userData } = user.toObject();

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
    const user = await User.findById(userId).select("-password -__v").populate([
      {
        path: "roles",
        select: "name",
      },
      {
        path: "managedPatients",
        select: "name phone",
      }
    ]);

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

export const lookupCaregiverByPhone = async (
  phoneNumber: string,
  currentUserId?: string
): Promise<CaregiverLookupResponse> => {
  const normalizedPhone = normalizePhone(phoneNumber);

  if (!normalizedPhone) {
    throw new Error("Phone number is required");
  }

  if (currentUserId) {
    const conflictingUser = await User.findOne(buildConflictQuery(currentUserId, normalizedPhone))
      .select("name")
      .lean();

    if (conflictingUser) {
      return {
        found: false,
        phoneNumber: normalizedPhone,
        conflict: true,
        conflictMessage: "This caregiver is already linked to another patient.",
      };
    }
  }

  const user = await User.findOne({ phone: normalizedPhone })
    .select("_id name phone isPhoneVerified")
    .lean();

  if (!user || String(user._id) === currentUserId) {
    return { found: false, phoneNumber: normalizedPhone };
  }

  return {
    found: true,
    userId: String(user._id),
    name: user.name,
    phoneNumber: user.phone,
    isPhoneVerified: user.isPhoneVerified,
  };
};

const buildCaregiverContact = async (
  userId: string,
  caregiver: OnboardingCaregiverInput,
  existingContact?: Record<string, any>
) => {
  const normalizedPhone = normalizePhone(caregiver.phoneNumber);

  if (!normalizedPhone) {
    throw new Error("Caregiver phone number is required");
  }

  const lookup = await lookupCaregiverByPhone(normalizedPhone, userId);

  if (lookup.conflict) {
    throw new Error(lookup.conflictMessage || "This caregiver is already linked to another patient.");
  }

  const linkedUser = lookup.found
    ? {
        _id: lookup.userId,
        name: lookup.name,
        phone: lookup.phoneNumber,
        isPhoneVerified: lookup.isPhoneVerified,
      }
    : null;

  return {
    userId: linkedUser?._id || existingContact?.userId || null,
    name: caregiver.name?.trim() || linkedUser?.name || existingContact?.name || "",
    phoneNumber: normalizedPhone,
    relation: caregiver.relation?.trim() || existingContact?.relation || "",
    verificationStatus: linkedUser ? "verified_user" : existingContact?.verificationStatus || "unregistered_contact",
    inviteStatus: existingContact?.inviteStatus || "invite_sent",
  };
};

export const saveOnboardingProfile = async (
  userId: string,
  data: SaveOnboardingProfileInput
) => {
  const existingUser = await User.findById(userId).select("preferences caregiverContacts").lean();

  if (!existingUser) {
    throw new Error("User not found");
  }

  const existingContacts = existingUser.caregiverContacts || [];
  const caregiverContacts = data.caregivers === undefined
    ? existingContacts
    : await Promise.all(
        data.caregivers.map(async (caregiver) => {
          const normalizedPhone = normalizePhone(caregiver.phoneNumber);
          const existingContact = existingContacts.find((contact: any) => contact.phoneNumber === normalizedPhone);

          return buildCaregiverContact(userId, caregiver, existingContact);
        })
      );

  const linkedCaregiverIds = caregiverContacts
    .filter(c => c.inviteStatus === "accepted")
    .map((caregiver) => caregiver.userId)
    .filter(Boolean);

  const updateData: Record<string, any> = {
    caregiverContacts,
    caregivers: linkedCaregiverIds,
    preferences: {
      ...(existingUser.preferences ?? {}),
      ...(data.preferences ?? {}),
    },
  };

  if (data.name !== undefined) updateData.name = data.name?.trim();
  if (data.gender !== undefined) updateData.gender = data.gender;
  if (data.conditions !== undefined) updateData.conditions = data.conditions;
  if (data.languages !== undefined) updateData.languages = data.languages;
  if (data.isOnboardingCompleted !== undefined) updateData.isOnboardingCompleted = data.isOnboardingCompleted;

  const onboardingStep = buildOnboardingStep(data);
  if (onboardingStep !== undefined) {
    updateData.onboardingStep = onboardingStep;
  }

  if (data.dateOfBirth) {
    updateData.dateOfBirth = new Date(data.dateOfBirth);
  }

  if (data.weight !== undefined && data.weight !== "") {
    updateData.weight = Number(data.weight);
  }

  const updatedUser = await User.findByIdAndUpdate(userId, { $set: updateData }, { new: true })
    .select("-password -__v")
    .populate([
      {
        path: "roles",
        select: "name",
      },
    ]);

  if (!updatedUser) {
    throw new Error("Failed to save onboarding profile");
  }

  // Create or update separate invitation records for easy lookups
  if (data.caregivers && data.caregivers.length > 0) {
    for (const caregiver of data.caregivers) {
      await syncCaregiverInvitationRecord(String(updatedUser._id), updatedUser.name || "Patient", caregiver, updateData.caregivers || []);
    }
  }

  return updatedUser.toObject();
};

const syncCaregiverInvitationRecord = async (
  senderId: string,
  senderName: string,
  caregiver: OnboardingCaregiverInput,
  linkedCaregiverIds: any[]
) => {
  try {
    const normalizedPhone = normalizePhone(caregiver.phoneNumber);
    const caregiverLookup = await User.findOne({ phone: normalizedPhone }).select("_id").lean();

    await CaregiverInvitation.findOneAndUpdate(
      { senderUserId: senderId, caregiverPhone: normalizedPhone },
      {
        caregiverUserId: caregiverLookup?._id,
        status: linkedCaregiverIds.some(id => String(id) === String(caregiverLookup?._id || "")) ? "accepted" : "invited",
        message: caregiver.relation ? `${senderName} added you as their ${caregiver.relation}` : undefined,
      },
      { upsert: true, new: true }
    );

    // Notify caregiver if they are already a registered user
    if (caregiverLookup?._id) {
      emitToUser(String(caregiverLookup._id), "new-caregiver-invitation", {
        senderId: senderId,
        senderName: senderName,
      });
    }
  } catch (error) {
    console.error("Failed to sync CaregiverInvitation record:", error);
  }
};

export const upsertCaregiverInvitation = async (
  userId: string,
  caregiver: OnboardingCaregiverInput
) => {
  const user = await User.findById(userId).select("name caregiverContacts caregivers").lean();

  if (!user) {
    throw new Error("User not found");
  }

  const normalizedPhone = normalizePhone(caregiver.phoneNumber);

  if (!/^[6-9]\d{9}$/.test(normalizedPhone)) {
    throw new Error("Caregiver phone number is invalid.");
  }

  const existingContact = (user.caregiverContacts || []).find(
    (contact: any) => contact.phoneNumber === normalizedPhone
  );
  const nextContact = await buildCaregiverContact(userId, caregiver, existingContact);

  if (!nextContact.userId) {
    nextContact.inviteStatus = "invite_sent";
  }

  const caregiverContacts = [
    ...(user.caregiverContacts || []).filter((contact: any) => contact.phoneNumber !== normalizedPhone),
    nextContact,
  ];
  const caregivers = Array.from(
    new Set(
      caregiverContacts
        .filter((c: any) => c.inviteStatus === "accepted")
        .map((contact: any) => (contact.userId ? String(contact.userId) : null))
        .filter(Boolean)
    )
  );

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { $set: { caregiverContacts, caregivers } },
    { new: true }
  )
    .select("-password -__v")
    .populate([{ path: "roles", select: "name" }]);

  if (!updatedUser) {
    throw new Error("Failed to save caregiver invitation");
  }

  // Create or update a separate invitation record for easy lookups
  await syncCaregiverInvitationRecord(String(updatedUser._id), updatedUser.name || "Patient", caregiver, caregivers);

  return updatedUser.toObject();
}

export const getInvitationsForUserByPhone = async (phone: string) => {
  const normalizedPhone = normalizePhone(phone);
  if (!normalizedPhone) return [];

  const invitations = await CaregiverInvitation.find({
    caregiverPhone: normalizedPhone,
    status: "invited",
  })
    .populate({
      path: "senderUserId",
      select: "name phone",
    })
    .lean();

  return invitations.map((inv: any) => ({
    _id: inv._id,
    senderId: inv.senderUserId?._id,
    senderName: inv.senderUserId?.name,
    senderPhone: inv.senderUserId?.phone,
    caregiverPhone: inv.caregiverPhone,
    status: inv.status,
    message: inv.message,
    createdAt: inv.createdAt,
  }));
};

export const respondToCaregiverInvitationById = async (
  caregiverUserId: string,
  invitationId: string,
  status: "accepted" | "rejected"
) => {
  const invitation = await CaregiverInvitation.findById(invitationId);
  if (!invitation) {
    throw new Error("Invitation not found");
  }

  // Update invitation status
  invitation.status = status;
  invitation.caregiverUserId = new mongoose.Types.ObjectId(caregiverUserId);
  await invitation.save();

  // Update both Users through existing respondToCaregiverInvitation logic
  return await respondToCaregiverInvitation(caregiverUserId, {
    patientUserId: String(invitation.senderUserId),
    status,
  });
};

export const removeCaregiverInvitation = async (userId: string, phoneNumber: string) => {
  const normalizedPhone = normalizePhone(phoneNumber);
  const user = await User.findById(userId).select("caregiverContacts caregivers").lean();

  if (!user) {
    throw new Error("User not found");
  }

  const caregiverContacts = (user.caregiverContacts || []).filter(
    (contact: any) => contact.phoneNumber !== normalizedPhone
  );
  const caregivers = Array.from(
    new Set(
      caregiverContacts
        .map((contact: any) => (contact.userId ? String(contact.userId) : null))
        .filter(Boolean)
    )
  );

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { $set: { caregiverContacts, caregivers } },
    { new: true }
  )
    .select("-password -__v")
    .populate([{ path: "roles", select: "name" }]);

  if (!updatedUser) {
    throw new Error("Failed to remove caregiver");
  }

  return updatedUser.toObject();
};

export const respondToCaregiverInvitation = async (
  caregiverUserId: string,
  data: CaregiverInvitationStatusInput
) => {
  if (!data.patientUserId || !data.status) {
    throw new Error("Patient and status are required");
  }

  const caregiverUser = await User.findById(caregiverUserId).select("phone").lean();
  if (!caregiverUser) {
    throw new Error("Caregiver user not found");
  }

  const patient = await User.findById(data.patientUserId).select("caregiverContacts caregivers");
  if (!patient) {
    throw new Error("Patient not found");
  }

  const normalizedPhone = normalizePhone(caregiverUser.phone);
  const caregiverContacts = (patient.caregiverContacts || []).map((contact: any) => {
    if (contact.phoneNumber !== normalizedPhone && String(contact.userId || "") !== caregiverUserId) {
      return contact;
    }

    return {
      ...(typeof contact.toObject === "function" ? contact.toObject() : contact),
      userId: caregiverUserId,
      verificationStatus: "verified_user",
      inviteStatus: data.status,
    };
  });

  const caregivers = data.status === "accepted"
    ? Array.from(new Set([...(patient.caregivers || []).map((id: any) => String(id)), caregiverUserId]))
    : (patient.caregivers || []).map((id: any) => String(id)).filter((id: string) => id !== caregiverUserId);

  patient.set({ caregiverContacts, caregivers });
  await patient.save();

  const res = await User.findByIdAndUpdate(data.patientUserId, { 
    $set: { caregiverContacts, caregivers } 
  }, { new: true })
  .select("-password -__v")
  .populate([{ path: "roles", select: "name" }]);

  if (!res) {
    throw new Error("Failed to update caregiver invitation status");
  }

  // Also update Caregiver's managedPatients list
  const caregiver = await User.findById(caregiverUserId);
  if (caregiver) {
    if (data.status === "accepted") {
      const managedPatients = Array.from(new Set([
        ...(caregiver.managedPatients || []).map(id => String(id)),
        String(data.patientUserId)
      ]));
      caregiver.managedPatients = managedPatients as any;
    } else {
      caregiver.managedPatients = (caregiver.managedPatients || []).filter(id => String(id) !== String(data.patientUserId));
    }
    await caregiver.save();
  }

  // Notify patient in real-time
  emitToUser(String(data.patientUserId), "caregiver-invitation-response", {
    caregiverUserId,
    status: data.status,
    caregiverName: caregiver?.name
  });

  return res.toObject();
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