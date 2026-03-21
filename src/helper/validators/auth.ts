import { validatePhone, validateEmail, validateString } from "./common";
import User from "../../models/User";

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
