import { NextFunction, Request, Response } from "express";
import RoleModel from "../models/Role";

export const requirePermission = (permission: string) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        const user: any = (req as any).user;

        if (!user) {
            return res.status(401).json({
                message: "Authentication required",
            });
        }

        const role = await RoleModel.findOne({ _id: user.role?._id }).populate({ path: "permissions", select: "name code" });

        const hasPermission = role?.permissions?.some((p: any) => p.code === permission);

        if (!hasPermission) {
            return res.status(403).json({
                message: "You do not have permission to perform this action",
            });
        }

        next();
    };
};