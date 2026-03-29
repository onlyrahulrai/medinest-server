import User from "../models/User";
import CaregiverInvitationModel from "../models/CaregiverInvitation";
import { emitToUser } from "../helper/utils/socket";
import * as NotificationService from "./notificationService";
import * as CaregiverRelationService from "./caregiverRelationService";
import { CreateInvitationRequest } from "../types/schema/Caregiver";
import { normalizePhone } from "../helper/utils/common";
import mongoose from "mongoose";

export const getInvitationsForUser = async (userId: string, type?: "incoming" | "sent", status?: string) => {
  try {
    const query: Record<string, any> = {};

    if (type === "incoming") {
      query.receiverUserId = userId;
    } else if (type === "sent") {
      query.senderUserId = userId;
    }

    if (status) {
      query.status = status;
    }

    const invitations = await CaregiverInvitationModel.find(query).select("_id senderUserId receiverUserId receiverPhone caregiverName relation status message createdAt expiresAt respondedAt")
      .populate({
        path: "senderUserId receiverUserId",
        select: "name phone",
      })
      .lean();

    // Convert ObjectIds to strings for JSON serialization
    return invitations.map(invitation => ({
      ...invitation,
      _id: invitation._id.toString(),
      senderUserId: invitation.senderUserId ? {
        ...invitation.senderUserId,
        _id: invitation.senderUserId._id.toString()
      } : null,
      receiverUserId: invitation.receiverUserId ? {
        ...invitation.receiverUserId,
        _id: invitation.receiverUserId._id.toString()
      } : null,
      createdAt: invitation.createdAt.toISOString(),
      expiresAt: invitation.expiresAt ? invitation.expiresAt.toISOString() : null,
      respondedAt: invitation.respondedAt ? invitation.respondedAt.toISOString() : null,
    }));
  } catch (error: any) {
    throw new Error(error.message || "Failed to fetch invitations");
  }
};

export const getInvitationById = async (userId: string, invitationId: string) => {
  try {
    const invitation = await CaregiverInvitationModel.findOne({
      _id: invitationId,
      $or: [
        { senderUserId: userId },
        { receiverUserId: userId }
      ]
    }).populate({
      path: "senderUserId receiverUserId",
      select: "name phone",
    }).lean();

    if (!invitation) {
      throw new Error("Invitation not found or unauthorized");
    }

    // Convert ObjectIds to strings for JSON serialization
    return {
      ...invitation,
      _id: invitation._id.toString(),
      senderUserId: invitation.senderUserId ? {
        ...invitation.senderUserId,
        _id: invitation.senderUserId._id.toString()
      } : null,
      receiverUserId: invitation.receiverUserId ? {
        ...invitation.receiverUserId,
        _id: invitation.receiverUserId._id.toString()
      } : null,
      createdAt: invitation.createdAt.toISOString(),
      expiresAt: invitation.expiresAt ? invitation.expiresAt.toISOString() : null,
      respondedAt: invitation.respondedAt ? invitation.respondedAt.toISOString() : null,
    };
  } catch (error: any) {
    throw new Error(error.message || "Failed to fetch invitation");
  }
};

export const respondToInvitation = async (
  caregiverUserId: string,
  invitationId: string,
  action: "accept" | "reject"
) => {
    console.log(`Responding to invitation ${invitationId} with action ${action} by user ${caregiverUserId}`);

  const session = await mongoose.startSession();

  session.startTransaction();

  try {
    const invitation = await CaregiverInvitationModel.findById(invitationId).session(session);

    console.log("Fetched invitation:", invitation);

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

    console.log("Invitation found:", invitation);

    const status = action === "accept" ? "accepted" : "rejected";
    invitation.status = status;
    invitation.receiverUserId = new mongoose.Types.ObjectId(caregiverUserId);
    invitation.respondedAt = new Date();
    await invitation.save({ session });

    let relation = null;
    if (action === "accept") {
      // Create relation using the invitation service
      relation = await CaregiverRelationService.createRelationFromInvitation(invitation, session);
    }

    await session.commitTransaction();
    session.endSession();

    const caregiverUser = await User.findById(caregiverUserId)
      .select("name")
      .lean();

    emitToUser(String(invitation.senderUserId), "caregiver-invitation-response", {
      caregiverUserId,
      action,
      caregiverName: caregiverUser?.name,
    });

    return {
      invitation: {
        ...invitation.toObject(),
        _id: invitation._id.toString(),
        senderUserId: invitation.senderUserId.toString(),
        receiverUserId: invitation.receiverUserId ? invitation.receiverUserId.toString() : null,
        createdAt: invitation.createdAt.toISOString(),
        expiresAt: invitation.expiresAt ? invitation.expiresAt.toISOString() : null,
        respondedAt: invitation.respondedAt ? invitation.respondedAt.toISOString() : null,
      },
      relation: relation ? {
        ...relation.toObject(),
        _id: relation._id.toString(),
        user: relation.user.toString(),
        caregiver: relation.caregiver ? relation.caregiver.toString() : null,
        invitedAt: relation.invitedAt ? relation.invitedAt.toISOString() : null,
        respondedAt: relation.respondedAt ? relation.respondedAt.toISOString() : null,
        createdAt: relation.createdAt.toISOString(),
        updatedAt: relation.updatedAt.toISOString(),
      } : null
    };
  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();
    throw new Error(error.message || "Failed to respond to invitation");
  }
};

export const resendInvitation = async (userId: string, invitationId: string) => {
  try {
    const invitation = await CaregiverInvitationModel.findOne({
      _id: invitationId,
      senderUserId: userId,
      status: { $in: ["pending", "expired"] }
    });

    if (!invitation) {
      throw new Error("Invitation not found or cannot be resent");
    }

    invitation.status = "pending";
    invitation.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    invitation.respondedAt = undefined;
    await invitation.save();

    // Send notification if receiver exists
    if (invitation.receiverUserId) {
      await NotificationService.send({
        userId: invitation.receiverUserId,
        title: "Caregiver Invitation",
        message: "You have been invited as a caregiver",
        type: "system",
        relatedType: "invitation",
      });

      emitToUser(String(invitation.receiverUserId), "new-caregiver-invitation", {
        senderId: userId,
        senderName: "User", // Can populate
      });
    }

    return { message: "Invitation resent successfully" };
  } catch (error: any) {
    throw new Error(error.message || "Failed to resend invitation");
  }
};

export const deleteInvitation = async (userId: string, invitationId: string) => {
  try {
    const invitation = await CaregiverInvitationModel.findOne({
      _id: invitationId,
      senderUserId: userId,
      status: "pending"
    });

    if (!invitation) {
      throw new Error("Invitation not found or cannot be deleted");
    }

    await invitation.deleteOne();

    return { message: "Invitation deleted successfully" };
  } catch (error: any) {
    throw new Error(error.message || "Failed to delete invitation");
  }
};

export const createInvitation = async (userId: string, payload: CreateInvitationRequest) => {
  try {
    const { caregiverPhone, caregiverName, relation, message } = payload;

    const normalizedPhone = normalizePhone(caregiverPhone);

    if (!normalizedPhone) {
      throw new Error("Phone number is required");
    }

    // Check for existing pending invitation
    const existingInvitation = await CaregiverInvitationModel.findOne({
      senderUserId: userId,
      receiverPhone: normalizedPhone,
      status: "pending"
    });

    if (existingInvitation) {
      throw new Error("Pending invitation already exists for this phone number");
    }

    const existingUser = await User.findOne({ phone: normalizedPhone }).select("_id name").lean();

    const patient = await User.findById(userId).select("name").lean();

    if (!patient) {
      throw new Error("User not found");
    }

    const invitation = new CaregiverInvitationModel({
      senderUserId: userId,
      receiverPhone: normalizedPhone,
      receiverUserId: existingUser ? existingUser._id : null,
      caregiverName,
      relation,
      status: "pending",
      message: message || `${patient.name || "A user"} invited you as their caregiver`,
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

    return {
      success: true,
      message: "Invitation sent successfully",
      data: {
        ...invitation.toObject(),
        _id: invitation._id.toString(),
        senderUserId: invitation.senderUserId.toString(),
        receiverUserId: invitation.receiverUserId ? invitation.receiverUserId.toString() : null,
        createdAt: invitation.createdAt.toISOString(),
        expiresAt: invitation.expiresAt ? invitation.expiresAt.toISOString() : null,
        respondedAt: invitation.respondedAt ? invitation.respondedAt.toISOString() : null,
      }
    };
  } catch (error: any) {
    throw new Error(error.message || "Failed to create invitation");
  }
};