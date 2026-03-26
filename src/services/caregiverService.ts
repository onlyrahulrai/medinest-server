import User from "../models/User";
import CaregiverInvitationModel from "../models/CaregiverInvitation";
import CaregiverModel from "../models/Caregiver";
import mongoose from "mongoose";
import { emitToUser } from "../helper/utils/socket";
import { CaregiverInvitationStatusInput, CaregiverLookupResponse, OnboardingCaregiverInput } from "../types/schema/Auth";

export const normalizePhone = (phone?: string) => phone?.replace(/\D/g, "") ?? "";

const ACTIVE_INVITE_STATUSES = ["pending_invite", "invite_sent", "accepted"] as const;

const buildConflictQuery = (currentUserId: string, phoneNumber: string) => ({
  _id: { $ne: currentUserId },
  caregiverContacts: {
    $elemMatch: {
      phoneNumber,
      inviteStatus: { $in: [...ACTIVE_INVITE_STATUSES] },
    },
  },
});

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
    .select("_id name phone verified")
    .lean();

  if (!user || String(user._id) === currentUserId) {
    return { found: false, phoneNumber: normalizedPhone };
  }

  return {
    found: true,
    userId: String(user._id),
    name: user.name,
    phoneNumber: user.phone,
    verified: user.verified,
  };
};

export const upsertCaregiverInvitation = async (
  userId: string,
  caregiver: OnboardingCaregiverInput
) => {
  const patient = await User.findById(userId).select("name").lean();

  if (!patient) {
    throw new Error("User not found");
  }

  const normalizedPhone = normalizePhone(caregiver.phone || "");

  if (!/^[6-9]\d{9}$/.test(normalizedPhone)) {
    throw new Error("Caregiver phone number is invalid.");
  }

  // 1. Create or Update Invitation record
  const existingUser = await User.findOne({ phone: normalizedPhone }).select("_id").lean();

  await CaregiverInvitationModel.findOneAndUpdate(
    { senderUserId: userId, receiverPhone: normalizedPhone },
    {
      receiverUserId: existingUser?._id,
      status: "pending",
      message: caregiver.relation ? `${patient.name} added you as their ${caregiver.relation}` : undefined,
    },
    { upsert: true, new: true }
  );

  // 2. Create or Update Relation record
  const nextStatus = existingUser ? "pending_invite" : "unregistered";

  const updatedRelation = await CaregiverModel.findOneAndUpdate(
    { user: userId, caregiverPhone: normalizedPhone },
    {
      caregiver: existingUser?._id || null,
      caregiverName: caregiver.name,
      relation: caregiver.relation,
      status: nextStatus,
      invitedAt: new Date(),
    },
    { upsert: true, new: true }
  ).lean();

  // 3. Notify caregiver if they are registered
  if (existingUser?._id) {
    emitToUser(String(existingUser._id), "new-caregiver-invitation", {
      senderId: userId,
      senderName: patient.name,
    });
  }

  return updatedRelation;
};

export const getInvitationsForUserByPhone = async (phone: string) => {
  const normalizedPhone = normalizePhone(phone);
  if (!normalizedPhone) return [];

  const invitations = await CaregiverInvitationModel.find({
    receiverPhone: normalizedPhone,
    status: "pending",
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
    receiverPhone: inv.receiverPhone,
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
  const session = await mongoose.startSession();

  session.startTransaction();

  try {
    const invitation = await CaregiverInvitationModel.findById(invitationId).session(session);

    if (!invitation) {
      throw new Error("Invitation not found");
    }

    // 🔐 Security check
    if (
      invitation.receiverUserId &&
      invitation.receiverUserId.toString() !== caregiverUserId
    ) {
      throw new Error("Unauthorized action");
    }

    // ⛔ Prevent re-processing
    if (!["pending"].includes(invitation.status)) {
      throw new Error("Invitation already handled");
    }

    // ⏳ Expiry check
    if (invitation.expiresAt && invitation.expiresAt < new Date()) {
      throw new Error("Invitation expired");
    }

    // ----------------------------------
    // 1. Update invitation
    // ----------------------------------
    invitation.status = status;
    invitation.receiverUserId = new mongoose.Types.ObjectId(caregiverUserId);
    invitation.respondedAt = new Date();
    await invitation.save({ session });

    // ----------------------------------
    // 2. Update relation (STRONG QUERY)
    // ----------------------------------
    const relation = await CaregiverModel.findOneAndUpdate(
      {
        user: invitation.senderUserId,
        caregiverPhone: invitation.receiverPhone,
        status: { $in: ["pending_invite", "unregistered"] },
      },
      {
        caregiver: new mongoose.Types.ObjectId(caregiverUserId),
        status: status,
        respondedAt: new Date(),
      },
      { new: true, session }
    );

    if (!relation) {
      throw new Error("Caregiver relation not found");
    }

    // ----------------------------------
    // 3. Extra handling (accepted case)
    // ----------------------------------
    if (status === "accepted") {
      // ❗ Expire other pending invites from same sender → same phone
      await CaregiverInvitationModel.updateMany(
        {
          _id: { $ne: invitation._id },
          senderUserId: invitation.senderUserId,
          receiverPhone: invitation.receiverPhone,
          status: "pending",
        },
        {
          $set: {
            status: "expired",
            respondedAt: new Date(),
          },
        },
        { session }
      );
    }

    await session.commitTransaction();
    session.endSession();

    // ----------------------------------
    // 4. Notify patient (outside txn)
    // ----------------------------------
    const caregiverUser = await User.findById(caregiverUserId)
      .select("name")
      .lean();

    emitToUser(String(invitation.senderUserId), "caregiver-invitation-response", {
      caregiverUserId,
      status,
      caregiverName: caregiverUser?.name,
    });

    return relation;
  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();
    throw new Error(error.message || "Failed to respond to invitation");
  }
};

export const removeCaregiver = async (
  userId: string,
  relationId: string
) => {
  const relation = await CaregiverModel.findOne({
    _id: relationId,
    $or: [
      { user: userId },
      { caregiver: userId }
    ]
  });

  if (!relation) {
    throw new Error("Caregiver relation not found or unauthorized");
  }

  // Soft remove
  relation.status = "removed";
  relation.respondedAt = new Date();
  await relation.save();

  // Expire related invites (only if patient triggered)
  if (relation.user.toString() === userId) {
    await CaregiverInvitationModel.updateMany(
      {
        senderUserId: userId,
        receiverPhone: relation.caregiverPhone,
        status: { $in: ["pending", "unregistered"] },
      },
      {
        $set: {
          status: "expired",
          respondedAt: new Date(),
        },
      }
    );
  }

  // Reverse cleanup
  if (relation.caregiver) {
    await CaregiverModel.updateMany(
      {
        user: relation.caregiver,
        caregiver: relation.user,
        status: "accepted",
      },
      {
        $set: {
          status: "removed",
          respondedAt: new Date(),
        },
      }
    );
  }

  return { message: "Caregiver relation removed successfully" };
};