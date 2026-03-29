// This file is deprecated. Logic has been split into:
// - caregiverInvitationService.ts (for invitation workflow)
// - caregiverRelationService.ts (for relations management)

// Keeping this file temporarily for backward compatibility
// TODO: Remove this file after ensuring all imports are updated

export * from "./caregiverInvitationService";
export * from "./caregiverRelationService";
    }

    return invitation;
  } catch (error: any) {
    throw new Error(error.message || "Failed to fetch invitation");
  }
};

export const respondToCaregiverInvitationById = async (
  caregiverUserId: string,
  invitationId: string,
  action: "accept" | "reject"
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

    const status = action === "accept" ? "accepted" : "rejected";
    invitation.status = status;
    invitation.receiverUserId = new mongoose.Types.ObjectId(caregiverUserId);
    invitation.respondedAt = new Date();
    await invitation.save({ session });

    let relation = null;
    if (action === "accept") {
      // Create relation
      relation = new CaregiverModel({
        user: invitation.senderUserId,
        caregiver: new mongoose.Types.ObjectId(caregiverUserId),
        caregiverName: "", // Can be updated later
        caregiverPhone: invitation.receiverPhone,
        relation: "Other", // Default
        status: "accepted",
        invitedAt: invitation.createdAt,
        respondedAt: new Date(),
      });
      await relation.save({ session });

      // Expire other pending invites
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
      action,
      caregiverName: caregiverUser?.name,
    });

    return { invitation, relation };
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

    return relations;
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

    return relation;
  } catch (error: any) {
    throw new Error(error.message || "Failed to fetch relation details");
  }
};

export const createInvitation = async (userId: string, payload: CreateInvitationRequest) => {
  try {
    const { receiverPhone, message } = payload;

    const normalizedPhone = normalizePhone(receiverPhone);

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

    return { success: true, message: "Invitation sent successfully", data: invitation };
  } catch (error: any) {
    throw new Error(error.message || "Failed to create invitation");
  }
};

export const updateCaregiver = async (userId: string, relationId: string, payload: UpdateCaregiverRequest) => {
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

    return { message: "Caregiver relation removed successfully" };
  } catch (error: any) {
    throw new Error(error.message || "Failed to remove caregiver");
  }
};