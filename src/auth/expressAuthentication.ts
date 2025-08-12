import jwt from "jsonwebtoken";
import { Request } from "express";

export const expressAuthentication = async (
  request: Request,
  securityName: string
): Promise<any> => {
  if (securityName === "jwt") {
    const authHeader = request.headers["authorization"];

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      const err = new Error("Unauthorized") as any;
      err.status = 401;
      throw err;
    }

    const token = authHeader.split(" ")[1];

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!);
      // Attach user data to request object
      (request as any).user = decoded;
      return decoded as { userId: number };
    } catch (err) {
      const e = new Error("Invalid or expired token") as any;
      e.status = 403;
      throw e;
    }
  }

  const err = new Error("Unsupported security method") as any;
  err.status = 403;
  throw err;
};
