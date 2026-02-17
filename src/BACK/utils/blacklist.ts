import { prisma } from "../base/Base";
import { decodeToken } from "./jwt";

/**
 * Store a refresh token in the database
 * Called when user logs in
 */
export const storeRefreshToken = async (
  userId: string,
  token: string,
  expiresAt: Date,
): Promise<void> => {
  try {
    await prisma.refreshToken.create({
      data: {
        token,
        codUsuario: userId,
        expiresAt,
        blacklisted: false,
      },
    });
  } catch (error) {
    console.error("Error storing refresh token:", error);
    throw new Error("Failed to store refresh token");
  }
};

/**
 * Check if a refresh token is blacklisted
 * Returns true if blacklisted or not found
 */
export const isTokenBlacklisted = async (token: string): Promise<boolean> => {
  try {
    const tokenRecord = await prisma.refreshToken.findUnique({
      where: { token },
      select: { blacklisted: true },
    });

    // If token not found in DB or is blacklisted, return true
    return !tokenRecord || tokenRecord.blacklisted;
  } catch (error) {
    console.error("Error checking token blacklist:", error);
    // Fail secure: if we can't check, assume it's blacklisted
    return true;
  }
};

/**
 * Blacklist a specific refresh token
 * Called on logout
 */
export const blacklistToken = async (
  token: string,
  reason: "logout" | "security" | "expired" = "logout",
): Promise<void> => {
  try {
    await prisma.refreshToken.updateMany({
      where: { token },
      data: {
        blacklisted: true,
        blacklistedAt: new Date(),
      },
    });

    console.log(`✅ Token blacklisted. Reason: ${reason}`);
  } catch (error) {
    console.error("Error blacklisting token:", error);
    throw new Error("Failed to blacklist token");
  }
};

/**
 * Blacklist all refresh tokens for a specific user
 * Called when user changes password or for security reasons
 */
export const blacklistAllUserTokens = async (
  userId: string,
  reason: "logout" | "security" | "expired" = "security",
): Promise<void> => {
  try {
    const result = await prisma.refreshToken.updateMany({
      where: {
        codUsuario: userId,
        blacklisted: false,
      },
      data: {
        blacklisted: true,
        blacklistedAt: new Date(),
      },
    });

    console.log(
      `✅ Blacklisted ${result.count} tokens for user ${userId}. Reason: ${reason}`,
    );
  } catch (error) {
    console.error("Error blacklisting all user tokens:", error);
    throw new Error("Failed to blacklist user tokens");
  }
};

/**
 * Delete a specific refresh token from database
 * Alternative to blacklisting
 */
export const deleteRefreshToken = async (token: string): Promise<void> => {
  try {
    await prisma.refreshToken.deleteMany({
      where: { token },
    });
  } catch (error) {
    console.error("Error deleting refresh token:", error);
    throw new Error("Failed to delete refresh token");
  }
};

/**
 * Delete all refresh tokens for a specific user
 */
export const deleteAllUserTokens = async (userId: string): Promise<void> => {
  try {
    const result = await prisma.refreshToken.deleteMany({
      where: { codUsuario: userId },
    });

    console.log(`✅ Deleted ${result.count} tokens for user ${userId}`);
  } catch (error) {
    console.error("Error deleting all user tokens:", error);
    throw new Error("Failed to delete user tokens");
  }
};

/**
 * Clean up expired tokens from database
 * Should be run periodically (e.g., daily cron job)
 */
export const cleanupExpiredTokens = async (): Promise<number> => {
  try {
    const result = await prisma.refreshToken.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(), // Less than current time = expired
        },
      },
    });

    console.log(`🧹 Cleaned up ${result.count} expired tokens`);
    return result.count;
  } catch (error) {
    console.error("Error cleaning up expired tokens:", error);
    return 0;
  }
};

/**
 * Get all active (non-blacklisted, non-expired) tokens for a user
 * Useful for admin dashboard or user session management
 */
export const getUserActiveTokens = async (userId: string) => {
  try {
    return await prisma.refreshToken.findMany({
      where: {
        codUsuario: userId,
        blacklisted: false,
        expiresAt: {
          gt: new Date(), // Greater than current time = not expired
        },
      },
      select: {
        id: true,
        createdAt: true,
        expiresAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  } catch (error) {
    console.error("Error getting user active tokens:", error);
    return [];
  }
};

/**
 * Count how many active sessions a user has
 */
export const countUserActiveSessions = async (
  userId: string,
): Promise<number> => {
  try {
    return await prisma.refreshToken.count({
      where: {
        codUsuario: userId,
        blacklisted: false,
        expiresAt: {
          gt: new Date(),
        },
      },
    });
  } catch (error) {
    console.error("Error counting user sessions:", error);
    return 0;
  }
};

/**
 * Verify refresh token exists in database and is not blacklisted
 * Returns the token record if valid
 */
export const verifyRefreshTokenInDB = async (token: string) => {
  try {
    const tokenRecord = await prisma.refreshToken.findUnique({
      where: { token },
    });

    if (!tokenRecord) {
      throw new Error("Token not found");
    }

    if (tokenRecord.blacklisted) {
      throw new Error("Token has been revoked");
    }

    if (tokenRecord.expiresAt < new Date()) {
      throw new Error("Token has expired");
    }

    return tokenRecord;
  } catch (error) {
    throw error;
  }
};
