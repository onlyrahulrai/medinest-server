import { CreateCaregiverRequest, UpdateCaregiverRequest } from "../../types/schema/Caregiver";

export const validateManageCaregiver = (data: CreateCaregiverRequest) => {
  const errors: Record<string, string> = {};

  if (!data?.caregiverName?.trim()) {
    errors.caregiverName = "Caregiver name is required.";
  }

  if (!data?.caregiverPhone?.trim()) {
    errors.caregiverPhone = "Caregiver phone is required.";
  } else if (!/^[6-9]\d{9}$/.test(data.caregiverPhone.trim())) {
    errors.caregiverPhone = "Invalid caregiver phone number.";
  }

  if (!data?.relation?.trim()) {
    errors.relation = "Relation is required.";
  }

  return errors;
};

export const validateUpdateCaregiver = (data: UpdateCaregiverRequest) => {
  const errors: Record<string, string> = {};

  if (data?.caregiverName !== undefined && !data.caregiverName.trim()) {
    errors.caregiverName = "Caregiver name cannot be empty.";
  }

  if (data?.relation !== undefined && !data.relation.trim()) {
    errors.relation = "Relation cannot be empty.";
  }

  if ((data as any).caregiverPhone !== undefined) {
    errors.caregiverPhone = "Caregiver phone is immutable and cannot be updated.";
  }

  return errors;
};
