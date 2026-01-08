import jwt from "jsonwebtoken";
import path from "path";

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
export const formatFile = (file: Express.Multer.File, baseUrl: string) => {
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

/**
 * Shuffles an array using the Fisher-Yates shuffle algorithm.
 * For quiz options, ensures that "Other" or "None of these" options
 * are always placed at the end of the shuffled array.
 * @param array - The array to shuffle
 * @param type - Type of shuffle ("questions" or "options"), default is "questions"
 * @returns A new shuffled array without mutating the original
 */
export function shuffle(array: any[], type: string = "questions"): any[] {
  const arr = [...array]; // clone to avoid mutating original

  let other: any = null;

  if (type === "options") {
    // Pull out "Other" or "None of these" option if it exists
    const otherIndex = arr.findIndex((opt) =>
      typeof opt?.text === "string"
        ? ["other", "none of these"].includes(opt.text.toLowerCase())
        : false
    );

    if (otherIndex !== -1) {
      other = arr.splice(otherIndex, 1)[0]; // remove "Other"
    }
  }

  // Fisher-Yates shuffle algorithm
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }

  if (type === "options" && other) {
    arr.push(other); // put "Other" back at the end
  }

  return arr;
}
