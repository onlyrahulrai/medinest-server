import CaregiverModel from "../models/Caregiver";
import { UpdateCaregiverRequest } from "../types/schema/Caregiver";
import mongoose from "mongoose";

export const getRelations = async (userId: string, role?: string) => {
  try {
    const query: Record<string, any> = { status: { $ne: "removed" } };

    if (role === "caregiver") {
      query.caregiver = userId;
    } else {
      query.user = userId;
    }

    const relations = await CaregiverModel.find(query).populate({
      path: "user caregiver",
      select: "name phone",
    }).lean();

    // Convert ObjectIds to strings for JSON serialization
    return relations.map(relation => ({
      ...relation,
      _id: relation._id.toString(),
      user: relation.user ? {
        ...relation.user,
        _id: relation.user._id.toString()
      } : null,
      caregiver: relation.caregiver ? {
        ...relation.caregiver,
        _id: relation.caregiver._id.toString()
      } : null,
      invitedAt: relation.invitedAt ? relation.invitedAt.toISOString() : null,
      respondedAt: relation.respondedAt ? relation.respondedAt.toISOString() : null,
      createdAt: relation.createdAt.toISOString(),
      updatedAt: relation.updatedAt.toISOString(),
    }));
  } catch (error: any) {
    throw new Error(error.message || "Failed to fetch relations");
  }
};

export const getRelationDetails = async (userId: string, relationId: string) => {
  try {
    const relation = await CaregiverModel.findOne({
      _id: relationId,
      $or: [
        { user: userId },
        { caregiver: userId }
      ],
      status: { $ne: "removed" }
    }).populate({
      path: "user caregiver",
      select: "name phone",
    }).lean();

    if (!relation) {
      throw new Error("Relation not found or unauthorized");
    }

    // Convert ObjectIds to strings for JSON serialization
    return {
      ...relation,
      _id: relation._id.toString(),
      user: relation.user ? {
        ...relation.user,
        _id: relation.user._id.toString()
      } : null,
      caregiver: relation.caregiver ? {
        ...relation.caregiver,
        _id: relation.caregiver._id.toString()
      } : null,
      invitedAt: relation.invitedAt ? relation.invitedAt.toISOString() : null,
      respondedAt: relation.respondedAt ? relation.respondedAt.toISOString() : null,
      createdAt: relation.createdAt.toISOString(),
      updatedAt: relation.updatedAt.toISOString(),
    };
  } catch (error: any) {
    throw new Error(error.message || "Failed to fetch relation details");
  }
};

export const updateRelation = async (userId: string, relationId: string, payload: UpdateCaregiverRequest) => {
  try {
    const { caregiverName, relation, permissions } = payload;

    const caregiver = await CaregiverModel.findOne({ _id: relationId, user: userId });

    if (!caregiver) {
      throw new Error("Caregiver relation not found");
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

    return {
      ...caregiver.toObject(),
      _id: caregiver._id.toString(),
      user: caregiver.user.toString(),
      caregiver: caregiver.caregiver ? caregiver.caregiver.toString() : null,
      invitedAt: caregiver.invitedAt ? caregiver.invitedAt.toISOString() : null,
      respondedAt: caregiver.respondedAt ? caregiver.respondedAt.toISOString() : null,
      createdAt: caregiver.createdAt.toISOString(),
      updatedAt: caregiver.updatedAt.toISOString(),
    };
  } catch (error: any) {
    throw new Error(error.message || "Failed to update caregiver");
  }
};

export const removeRelation = async (
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

    return { message: "Caregiver relation removed successfully" };
  } catch (error: any) {
    throw new Error(error.message || "Failed to remove caregiver");
  }
};

export const createRelationFromInvitation = async (invitation: any, session: mongoose.ClientSession) => {
  try {
    // Create relation using data from invitation
    const relation = new CaregiverModel({
      user: invitation.senderUserId,
      caregiver: invitation.receiverUserId,
      caregiverName: invitation.caregiverName,
      caregiverPhone: invitation.receiverPhone,
      relation: invitation.relation,
      status: "accepted",
      invitedAt: invitation.createdAt,
      respondedAt: new Date(),
    });

    await relation.save({ session });

    // Expire other pending invites
    await mongoose.model("CaregiverInvitation").updateMany(
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

    return relation;
  } catch (error: any) {
    throw new Error(error.message || "Failed to create relation from invitation");
  }
};