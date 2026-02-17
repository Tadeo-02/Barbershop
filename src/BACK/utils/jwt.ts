import jwt from "jsonwebtoken";

// JWT Configuration
const ACCESS_TOKEN_SECRET =
  process.env.JWT_ACCESS_SECRET ||
  "your-access-secret-key-change-in-production";
const REFRESH_TOKEN_SECRET =
  process.env.JWT_REFRESH_SECRET ||
  "your-refresh-secret-key-change-in-production";
const ACCESS_TOKEN_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || "15m";
const REFRESH_TOKEN_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || "7d";

// Token version for invalidation (can be incremented to invalidate all tokens)
const TOKEN_VERSION = 1;

export interface AccessTokenPayload {
  userId: string;
  userType: "client" | "barber" | "admin";
  version: number;
}

export interface RefreshTokenPayload {
  userId: string;
  version: number;
}

/**
 * Generate Access Token (short-lived)
 * Contains user ID, user type, and version
 * Used for API authentication
 */
export const generateAccessToken = (
  userId: string,
  userType: "client" | "barber" | "admin",
): string => {
  const payload: AccessTokenPayload = {
    userId,
    userType,
    version: TOKEN_VERSION,
  };

  return jwt.sign(payload, ACCESS_TOKEN_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRES_IN,
  });
};

/**
 * Generate Refresh Token (long-lived)
 * Contains only user ID and version
 * Used to obtain new access tokens
 */
export const generateRefreshToken = (userId: string): string => {
  const payload: RefreshTokenPayload = {
    userId,
    version: TOKEN_VERSION,
  };

  return jwt.sign(payload, REFRESH_TOKEN_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRES_IN,
  });
};

/**
 * Generate both tokens at once
 * Returns access token and refresh token
 */
export const generateTokenPair = (
  userId: string,
  userType: "client" | "barber" | "admin",
): { accessToken: string; refreshToken: string } => {
  return {
    accessToken: generateAccessToken(userId, userType),
    refreshToken: generateRefreshToken(userId),
  };
};

/**
 * Verify Access Token
 * Throws error if invalid or expired
 */
export const verifyAccessToken = (token: string): AccessTokenPayload => {
  try {
    const decoded = jwt.verify(
      token,
      ACCESS_TOKEN_SECRET,
    ) as AccessTokenPayload;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error("Access token expired");
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error("Invalid access token");
    }
    throw new Error("Token verification failed");
  }
};

/**
 * Verify Refresh Token
 * Throws error if invalid or expired
 */
export const verifyRefreshToken = (token: string): RefreshTokenPayload => {
  try {
    const decoded = jwt.verify(
      token,
      REFRESH_TOKEN_SECRET,
    ) as RefreshTokenPayload;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error("Refresh token expired");
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error("Invalid refresh token");
    }
    throw new Error("Token verification failed");
  }
};

/**
 * Decode token without verification (for debugging)
 * Returns null if token is malformed
 */
export const decodeToken = (
  token: string,
): AccessTokenPayload | RefreshTokenPayload | null => {
  try {
    return jwt.decode(token) as AccessTokenPayload | RefreshTokenPayload;
  } catch {
    return null;
  }
};

/**
 * Get token expiration time in seconds
 */
export const getTokenExpiration = (token: string): number | null => {
  const decoded = decodeToken(token);
  return decoded && "exp" in decoded ? (decoded as any).exp : null;
};

/**
 * Check if token is expired without verifying signature
 */
export const isTokenExpired = (token: string): boolean => {
  const exp = getTokenExpiration(token);
  if (!exp) return true;
  return Date.now() >= exp * 1000;
};
