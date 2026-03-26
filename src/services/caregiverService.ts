import User from "../models/User";
import CaregiverInvitationModel from "../models/CaregiverInvitation";
import CaregiverModel from "../models/Caregiver";
import { emitToUser } from "../helper/utils/socket";
import * as NotificationService from "./notificationService";
import { CreateCaregiverRequest, UpdateCaregiverRequest } from "../types/schema/Caregiver";
import { normalizePhone } from "../helper/utils/common";
import mongoose from "mongoose";

export const getInvitationsForUserByPhone = async (phone: string) => {
  try {
    const normalizedPhone = normalizePhone(phone);

    if (!normalizedPhone) return [];

    const invitations = await CaregiverInvitationModel.find({
      receiverPhone: normalizedPhone,
      status: "pending",
    }).select("_id senderUserId receiverPhone status message createdAt")
      .populate({
        path: "senderUserId",
        select: "name phone",
      })
      .lean();

    return invitations;
  } catch (error: any) {
    throw new Error(error.message || "Failed to fetch invitations");
  }
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

    if (
      invitation.receiverUserId &&
      invitation.receiverUserId.toString() !== caregiverUserId
    ) {
      throw new Error("Unauthorized action");
    }

    if (!["pending"].includes(invitation.status)) {
      throw new Error("Invitation already handled");
    }

    if (invitation.expiresAt && invitation.expiresAt < new Date()) {
      throw new Error("Invitation expired");
    }

    invitation.status = status;
    invitation.receiverUserId = new mongoose.Types.ObjectId(caregiverUserId);
    invitation.respondedAt = new Date();
    await invitation.save({ session });

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

    if (status === "accepted") {
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

export const getCaregivers = async (userId: string) => {
  try {
    const caregivers = await CaregiverModel.find({
      user: userId,
      status: { $ne: "removed" }
    }).lean();

    return caregivers;
  } catch (error: any) {
    throw new Error(error.message || "Failed to fetch caregivers");
  }
};

export const getCaregiverDetails = async (caregiverId: string) => {
  try {
    const caregiver = await CaregiverModel.findOne({
      _id: caregiverId,
    }).lean();

    return caregiver;
  } catch (error: any) {
    throw new Error(error.message || "Failed to fetch caregiver");
  }
};

export const addCaregiver = async (userId: string, payload: CreateCaregiverRequest) => {
  try {
    const { caregiverName, caregiverPhone, relation, permissions } = payload;

    const normalizedPhone = normalizePhone(caregiverPhone);

    if (!normalizedPhone) {
      throw new Error("Phone number is required");
    }

    const existingRelation = await CaregiverModel.findOne({
      user: userId,
      caregiverPhone: normalizedPhone,
      status: { $in: ["pending_invite", "invite_sent", "accepted", "unregistered"] }
    }).lean();

    if (existingRelation) {
      throw new Error("Caregiver with this phone number already exists.");
    }

    const existingUser = await User.findOne({ phone: normalizedPhone }).select("_id name").lean();

    const patient = await User.findById(userId).select("name").lean();

    if (!patient) {
      throw new Error("User not found");
    }

    const status = existingUser ? "invite_sent" : "unregistered";

    const caregiverUserId = existingUser ? existingUser._id : null;

    const caregiver = new CaregiverModel({
      user: userId,
      caregiver: caregiverUserId,
      caregiverName,
      caregiverPhone: normalizedPhone,
      relation,
      status,
      permissions: permissions || {
        canViewMedicines: true,
        canEditMedicines: false,
        canReceiveAlerts: true,
        canViewHealthData: false,
      },
      invitedAt: new Date(),
    });

    await caregiver.save();

    const invitation = new CaregiverInvitationModel({
      senderUserId: userId,
      receiverPhone: normalizedPhone,
      receiverUserId: caregiverUserId,
      status: "pending",
      message: `${patient.name || "A user"} invited you as their ${relation}`,
    });

    await invitation.save();

    if (existingUser) {
      await NotificationService.send({
        userId: existingUser._id,
        title: "Caregiver Invitation",
        message: "You have been invited as a caregiver",
        type: "system",
        relatedType: "invitation",
      });

      emitToUser(String(existingUser._id), "new-caregiver-invitation", {
        senderId: userId,
        senderName: patient.name,
      });
    }

    return caregiver;
  } catch (error: any) {
    throw new Error(error.message || "Failed to add caregiver");
  }
};

export const updateCaregiver = async (userId: string, caregiverId: string, payload: UpdateCaregiverRequest) => {
  try {
    const { caregiverName, relation, permissions } = payload;

    const caregiver = await CaregiverModel.findOne({ _id: caregiverId, user: userId });

    if (!caregiver) {
      throw new Error("Caregiver not found");
    }

    if (caregiverName !== undefined) caregiver.caregiverName = caregiverName;

    if (relation !== undefined) caregiver.relation = relation;

    if (permissions) {
      caregiver.permissions = {
        ...caregiver.permissions,
        ...permissions
      };
    }

    await caregiver.save();

    return caregiver;
  } catch (error: any) {
    throw new Error(error.message || "Failed to update caregiver");
  }
};

export const removeCaregiver = async (
  userId: string,
  relationId: string
) => {
  try {
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

    relation.status = "removed";
    relation.respondedAt = new Date();
    await relation.save();

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
  } catch (error: any) {
    throw new Error(error.message || "Failed to remove caregiver");
  }
};