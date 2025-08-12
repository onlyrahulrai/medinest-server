import jwt from "jsonwebtoken";

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
