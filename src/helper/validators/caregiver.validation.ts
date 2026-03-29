import Joi from "joi";

export const createInvitationSchema = Joi.object({
  receiverPhone: Joi.string().required(),
  message: Joi.string().optional(),
});

export const respondInvitationSchema = Joi.object({
  action: Joi.string().valid("accept", "reject").required(),
});

export const updateRelationSchema = Joi.object({
  permissions: Joi.object().optional(),
  relation: Joi.string().valid("Father", "Mother", "Brother", "Sister", "Spouse", "Friend", "Other").optional(),
});