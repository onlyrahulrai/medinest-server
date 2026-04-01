import jwt from "jsonwebtoken";
import path from "path";
import CaregiverInvitationModel from "../../models/CaregiverInvitation";
import CaregiverModel from "../../models/Caregiver";
import User from "../../models/User";

/**
 * Generates a JWT token with the provided payload.
 * @param payload - The data to encode in the token
 * @param expiresIn - Token expiration time (default: "7d")
 * @returns The signed JWT token
 * @throws Error if JWT_SECRET is not defined in environment variables
 */
export const generateToken = (
  payload: object,
  expiresIn: string | number = "7d"
): string => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is not defined in environment variables.");
  }

  return jwt.sign(payload, secret, { expiresIn });
};

/**
 * Formats a file upload object to include metadata and URL information.
 * @param file - The Express Multer file object
 * @param baseUrl - The base URL for constructing the file access URL
 * @returns An object containing file metadata and the relative/absolute URL paths
 */
export const formatFile = (file: any, baseUrl: string) => {
  const relativePath = path
    .relative(process.cwd(), file.path)
    .replace(/\\/g, "/")
    .replace(/^.*uploads\//, "uploads/");

  return {
    originalname: file.originalname,
    mimetype: file.mimetype,
    size: file.size,
    filename: file.filename,
    relativePath: relativePath.replace(/^uploads\//, ""),
    url: `${baseUrl}/api/${relativePath}`,
  };
};

export const normalizePhone = (phone?: string) => phone?.replace(/\D/g, "") ?? "";

export const syncCaregiverData = async (data: { phone: string, userId: string }) => {
  const { phone, userId } = data;

  if (!phone) return;

  const user = await User.findById(userId);

  if (!user) return;

  // Invitations
  await CaregiverInvitationModel.updateMany(
    {
      receiverPhone: phone,
      receiver: null,
      status: "pending",
    },
    {
      $set: {
        receiver: user._id,
        status: "pending",
      },
    }
  );

  // Relations
  await CaregiverModel.updateMany(
    {
      caregiverPhone: phone,
      caregiver: null,
      status: "unregistered",
    },
    {
      $set: {
        caregiver: user._id,
        status: "pending_invite",
      },
    }
  );
};

export const getDurationInDays = (startDate: Date, endDate: Date) => {
  const diffTime = new Date(endDate).getTime() - new Date(startDate).getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const calculateEndDate = (startDate?: any, durationLabel?: string) => {
  if (!startDate) return undefined;

  const date = new Date(startDate);

  if (!durationLabel) return date;

  const label = durationLabel.toLowerCase();

  if (label.includes("day")) {
    const days = parseInt(label.match(/\d+/)?.[0] || "1");
    date.setDate(date.getDate() + days);
  } else if (label.includes("week")) {
    const weeks = parseInt(label.match(/\d+/)?.[0] || "1");
    date.setDate(date.getDate() + weeks * 7);
  } else if (label.includes("month")) {
    const months = parseInt(label.match(/\d+/)?.[0] || "1");
    date.setMonth(date.getMonth() + months);
  } else {
    switch (durationLabel) {
      case "Once daily":
        date.setDate(date.getDate() + 1);
        break;
      case "Twice daily":
        date.setDate(date.getDate() + 2);
        break;
      case "Three times daily":
        date.setDate(date.getDate() + 3);
        break;
      case "Four times daily":
        date.setDate(date.getDate() + 4);
        break;
      case "As needed":
        date.setDate(date.getDate() + 1);
        break;
      default:
        // Try adding 7 days by default for unknown non-empty labels as a fallback
        date.setDate(date.getDate() + 7);
        break;
    }
  }
  return date;
}