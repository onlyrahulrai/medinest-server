import User from "../models/User";
import CaregiverInvitationModel from "../models/CaregiverInvitation";
import CaregiverRelationModel from "../models/Caregiver";
import { emitToUser } from "../helper/utils/socket";
import * as NotificationService from "./notificationService";
import { CreateInvitationRequest } from "../types/schema/Caregiver";
import { normalizePhone } from "../helper/utils/common";
import mongoose from "mongoose";

export const getInvitationsForUser = async (userId: string, type?: "incoming" | "sent", status?: string) => {
    try {
        const query: Record<string, any> = {
            $or: [
                { sender: userId },
                { receiver: userId }
            ]
        };

        if (type === "incoming") {
            query.receiver = userId;
        } else if (type === "sent") {
            query.sender = userId;
        }

        if (status) {
            query.status = status;
        }

        const invitations = await CaregiverInvitationModel.find(query).select("_id sender receiver receiverPhone caregiverName relation status message createdAt expiresAt respondedAt")
            .populate({
                path: "sender receiver",
                select: "name phone",
            })
            .lean();

        // Convert ObjectIds to strings for JSON serialization
        return invitations.map(invitation => ({
            ...invitation,
            _id: invitation._id.toString(),
            sender: invitation.sender ? {
                ...invitation.sender,
                _id: invitation.sender._id.toString()
            } : null,
            receiver: invitation.receiver ? {
                ...invitation.receiver,
                _id: invitation.receiver._id.toString()
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
                { sender: userId },
                { receiver: userId }
            ]
        }).populate({
            path: "sender receiver",
            select: "name phone",
        }).lean();

        if (!invitation) {
            throw new Error("Invitation not found or unauthorized");
        }

        // Convert ObjectIds to strings for JSON serialization
        return {
            ...invitation,
            _id: invitation._id.toString(),
            sender: invitation.sender ? {
                ...invitation.sender,
                _id: invitation.sender._id.toString()
            } : null,
            receiver: invitation.receiver ? {
                ...invitation.receiver,
                _id: invitation.receiver._id.toString()
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
    console.log(
        `Responding to invitation ${invitationId} with action ${action} by user ${caregiverUserId}`
    );

    try {
        const invitation = await CaregiverInvitationModel.findById(invitationId);

        if (!invitation) {
            throw new Error("Invitation not found");
        }

        // 🔐 Authorization check
        if (
            invitation.receiver &&
            invitation.receiver.toString() !== caregiverUserId
        ) {
            throw new Error("Unauthorized action");
        }

        // ❌ Already handled
        if (!["pending"].includes(invitation.status)) {
            throw new Error("Invitation already handled");
        }

        // ⏰ Expiry check
        if (invitation.expiresAt && invitation.expiresAt < new Date()) {
            throw new Error("Invitation expired");
        }

        // ✅ Update invitation
        const status = action === "accept" ? "accepted" : "rejected";

        invitation.status = status;
        invitation.receiver = new mongoose.Types.ObjectId(caregiverUserId);
        invitation.respondedAt = new Date();

        await invitation.save();

        let relation: any = null;

        // ✅ Create relation ONLY if accepted
        if (action === "accept") {
            await CaregiverRelationModel.updateOne(
                {
                    user: invitation.sender,
                    caregiver: caregiverUserId,
                },
                {
                    $setOnInsert: {
                        user: invitation.sender,
                        caregiver: caregiverUserId,
                        caregiverPhone: invitation.receiverPhone,
                        caregiverName:
                            invitation.caregiverName || "Caregiver", // fallback
                        relation: invitation.relation || "Other",
                        status: "accepted",
                    },
                },
                { upsert: true }
            );

            await CaregiverInvitationModel.updateMany(
                {
                    _id: { $ne: invitation._id },
                    sender: invitation.sender,
                    receiverPhone: invitation.receiverPhone,
                    status: "pending",
                },
                {
                    $set: {
                        status: "expired",
                        respondedAt: new Date(),
                    },
                },
            );

            // Fetch created relation
            relation = await CaregiverRelationModel.findOne({
                user: invitation.sender,
                caregiver: caregiverUserId,
            });
        }

        // 🔔 Notify sender
        const caregiverUser = await User.findById(caregiverUserId)
            .select("name")
            .lean();

        emitToUser(
            String(invitation.sender),
            "caregiver-invitation-response",
            {
                caregiverUserId,
                action,
                caregiverName: caregiverUser?.name,
            }
        );

        return {
            invitation: {
                ...invitation.toObject(),
                _id: invitation._id.toString(),
                sender: invitation.sender.toString(),
                receiver: invitation.receiver
                    ? invitation.receiver.toString()
                    : null,
                createdAt: invitation.createdAt.toISOString(),
                expiresAt: invitation.expiresAt
                    ? invitation.expiresAt.toISOString()
                    : null,
                respondedAt: invitation.respondedAt
                    ? invitation.respondedAt.toISOString()
                    : null,
            },
            relation: relation
                ? {
                    ...relation.toObject(),
                    _id: relation._id.toString(),
                    user: relation.user.toString(),
                    caregiver: relation.caregiver
                        ? relation.caregiver.toString()
                        : null,
                    createdAt: relation.createdAt.toISOString(),
                    updatedAt: relation.updatedAt.toISOString(),
                }
                : null,
        };
    } catch (error: any) {
        throw new Error(error.message || "Failed to respond to invitation");
    }
};

export const resendInvitation = async (userId: string, invitationId: string) => {
    try {
        const invitation = await CaregiverInvitationModel.findOne({
            _id: invitationId,
            sender: userId,
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
        if (invitation.receiver) {
            await NotificationService.send({
                userId: invitation.receiver,
                title: "Caregiver Invitation",
                message: "You have been invited as a caregiver",
                type: "system",
                relatedType: "invitation",
            });

            emitToUser(String(invitation.receiver), "new-caregiver-invitation", {
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
            sender: userId,
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
            sender: userId,
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
            sender: userId,
            receiverPhone: normalizedPhone,
            receiver: existingUser ? existingUser._id : null,
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
                sender: invitation.sender.toString(),
                receiver: invitation.receiver ? invitation.receiver.toString() : null,
                createdAt: invitation.createdAt.toISOString(),
                expiresAt: invitation.expiresAt ? invitation.expiresAt.toISOString() : null,
                respondedAt: invitation.respondedAt ? invitation.respondedAt.toISOString() : null,
            }
        };
    } catch (error: any) {
        throw new Error(error.message || "Failed to create invitation");
    }
};