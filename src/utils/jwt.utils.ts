import jwt, { SignOptions } from "jsonwebtoken";

export interface JwtPayload {
  id: string;
  name: string;
  role: "submitter" | "approver";
}

const jwtSecret: string = process.env.JWT_SECRET || "test_secret";
const jwtExpiresIn: string = process.env.JWT_EXPIRES_IN || "1d";

/**
 * Generates a signed JWT with user ID, name, and role.
 */
export const generateToken = (payload: JwtPayload): string => {
  const options: SignOptions = {
    expiresIn: jwtExpiresIn as SignOptions["expiresIn"],
  };

  return jwt.sign(
    { id: payload.id, name: payload.name, role: payload.role },
    jwtSecret,
    options
  );
};
