import crypto from 'crypto';
import bcrypt from 'bcryptjs';

/**
 * Generate a secure 6-digit numeric OTP and its bcrypt hash.
 * Plain text is returned only once to deliver to the user, hash is saved to DB.
 */
export const generateSecureOTP = async () => {
  // Generate random 6-digit integer from 100000 to 999999
  const buffer = crypto.randomBytes(4);
  const num = buffer.readUInt32BE(0);
  const otp = (100000 + (num % 900000)).toString();

  const salt = await bcrypt.genSalt(10);
  const otpHash = await bcrypt.hash(otp, salt);

  return { otp, otpHash };
};

export const verifyOTP = async (plainOtp, otpHash) => {
  return await bcrypt.compare(plainOtp, otpHash);
};
