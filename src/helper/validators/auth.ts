import { validatePhone, validateEmail, validateString } from "./common";
import User from "../../models/User";
import { SaveOnboardingProfileInput } from "../../types/schema/Auth";

export const validateEditProfile = async (userId: string, values: Record<string, any>) => {
  let errors = validateEmail({}, values);
  validateString(errors, values, "name", { required: true });
  validatePhone(errors, values);

  const existingEmailUser = await User.findOne({
    email: values.email,
    _id: { $ne: userId }
  });

  const existingPhoneUser = await User.findOne({
    phone: values.phone,
    _id: { $ne: userId }
  });

  if (existingEmailUser) {
    errors.email = "This email is already in use";
  }

  if (existingPhoneUser) {
    errors.phone = "This phone number is already in use";
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
