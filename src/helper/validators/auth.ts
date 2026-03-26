import { validatePhone, validateEmail, validateString } from "./common";
import User from "../../models/User";
import { SaveOnboardingProfileInput } from "../../types/schema/Auth";

export const validateEditProfile = async (
  userId: string,
  values: Record<string, any>
) => {
  const errors: Record<string, any> = {};

  const email = values?.email?.trim().toLowerCase();
  const phone = values?.phone?.trim();

  // -------------------------
  // Step 1: Basic validation
  // -------------------------
  if (email) {
    validateEmail(errors, { ...values, email });
  }

  if (phone) {
    validatePhone(errors, { ...values, phone });
  }

  // -------------------------
  // Step 2: DB validation
  // -------------------------
  if (Object.keys(errors).length === 0) {
    const [existingEmailUser, existingPhoneUser] = await Promise.all([
      email
        ? User.findOne({ email, _id: { $ne: userId } }).select("_id")
        : null,
      phone
        ? User.findOne({ phone, _id: { $ne: userId } }).select("_id")
        : null,
    ]);

    if (existingEmailUser) {
      errors.email = "This email is already in use";
    }

    if (existingPhoneUser) {
      errors.phone = "This phone number is already in use";
    }
  }

  // -------------------------
  // Step 3: Caregiver validation
  // -------------------------
  if (values?.caregivers?.length) {
    const caregiverErrors: any[] = [];
    const seenPhones = new Set<string>();

    values.caregivers.forEach((caregiver: Record<string, any>, index: number) => {
      const error: Record<string, string> = {};

      const caregiverPhone = caregiver?.phone?.trim();

      // Normalize before validation
      validatePhone(error, { phone: caregiverPhone });

      validateString(error, { name: caregiver.name }, "name", {
        required: true,
        minLength: 2,
      });

      validateString(error, { relation: caregiver.relation }, "relation", {
        required: true,
        minLength: 2,
      });

      // ❗ Duplicate inside caregivers
      if (caregiverPhone) {
        if (seenPhones.has(caregiverPhone)) {
          error.phone = "Duplicate caregiver phone number";
        }
        seenPhones.add(caregiverPhone);
      }

      // ❗ Same as user phone
      if (phone && caregiverPhone === phone) {
        error.phone = "Caregiver phone cannot be same as user's phone";
      }

      // Maintain index alignment
      caregiverErrors[index] =
        Object.keys(error).length > 0 ? error : null;
    });

    // Only attach if any errors exist
    if (caregiverErrors.some((err) => err !== null)) {
      errors.caregivers = caregiverErrors;
    }
  }

  return errors;
};

export const validateVerifyPhone = (values: any) => {
  let errors: Record<string, string> = {};

  validatePhone(errors, values);
  validateString(errors, values, "otp", { required: true, minLength: 6 });

  return errors;
};

export const validateResendPhoneOtp = (values: any) => {
  let errors: Record<string, string> = {};

  validatePhone(errors, values);

  return errors;
};

export const validateOnboardingProfile = async (
  values: SaveOnboardingProfileInput
) => {
  const errors: Record<string, string> = {};

  validateString(errors, values as Record<string, any>, "name", { required: true, minLength: 2 });

  if (values.weight !== undefined && values.weight !== "") {
    const parsedWeight = Number(values.weight);

    if (Number.isNaN(parsedWeight) || parsedWeight <= 0) {
      errors.weight = "Weight must be a valid number.";
    }
  }

  if (values.dateOfBirth) {
    const parsedDate = new Date(values.dateOfBirth);

    if (Number.isNaN(parsedDate.getTime())) {
      errors.dateOfBirth = "Date of birth is invalid.";
    }
  }

  if (values.caregivers?.length) {
    values.caregivers.forEach((caregiver, index) => {
      if (!caregiver.phoneNumber) {
        return;
      }

      const normalizedPhone = caregiver.phoneNumber.replace(/\D/g, "");

      if (!/^[6-9]\d{9}$/.test(normalizedPhone)) {
        errors[`caregivers.${index}.phoneNumber`] = "Caregiver phone number is invalid.";
      }
    });
  }

  return errors;
};
