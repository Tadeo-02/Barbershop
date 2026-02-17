import { Request, Response, NextFunction } from "express";
import { verifyAccessToken, AccessTokenPayload } from "../utils/jwt";

// Extend Express Request to include user info
declare global {
  namespace Express {
    interface Request {
      user?: AccessTokenPayload;
    }
  }
}

/**
 * Middleware to authenticate requests using JWT
 * Verifies the access token from Authorization header
 * Adds user info to req.user if valid
 */
export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  try {
    // Get token from Authorization header
    const authHeader = req.header("Authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      res.status(401).json({
        success: false,
        message: "No se proporcionó token de autenticación",
      });
      return;
    }

    // Verify token
    const decoded = verifyAccessToken(token);

    // Attach user info to request
    req.user = decoded;

    // Also set x-user-id header for backward compatibility with rate limiters
    req.headers["x-user-id"] = decoded.userId;

    next();
  } catch (error) {
    console.error("Authentication error:", error);

    if (error instanceof Error) {
      if (error.message === "Access token expired") {
        res.status(401).json({
          success: false,
          message: "Token expirado. Por favor, renueve su token.",
          code: "TOKEN_EXPIRED",
        });
        return;
      }

      if (error.message === "Invalid access token") {
        res.status(403).json({
          success: false,
          message: "Token inválido",
        });
        return;
      }
    }

    res.status(500).json({
      success: false,
      message: "Error de autenticación",
    });
  }
};

/**
 * Middleware to check if user is an admin
 * Must be used after authenticateToken
 */
export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: "No autenticado",
    });
    return;
  }

  if (req.user.userType !== "admin") {
    res.status(403).json({
      success: false,
      message: "Se requieren privilegios de administrador",
    });
    return;
  }

  next();
};

/**
 * Middleware to check if user is a barber or admin
 * Must be used after authenticateToken
 */
export const requireBarberOrAdmin = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: "No autenticado",
    });
    return;
  }

  if (req.user.userType !== "barber" && req.user.userType !== "admin") {
    res.status(403).json({
      success: false,
      message: "Se requieren privilegios de barbero o administrador",
    });
    return;
  }

  next();
};

/**
 * Middleware to check if user is accessing their own resource
 * Compares req.user.userId with req.params.codUsuario
 * Admins can access any user's resource
 */
export const requireSelfOrAdmin = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: "No autenticado",
    });
    return;
  }

  const { codUsuario } = req.params;

  // Admin can access any user
  if (req.user.userType === "admin") {
    next();
    return;
  }

  // User can only access their own data
  if (req.user.userId !== codUsuario) {
    res.status(403).json({
      success: false,
      message: "No tiene permiso para acceder a este recurso",
    });
    return;
  }

  next();
};

/**
 * Optional authentication middleware
 * Adds user info if token is present and valid, but doesn't require it
 * Useful for endpoints that work both authenticated and unauthenticated
 */
export const optionalAuth = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  try {
    const authHeader = req.header("Authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (token) {
      const decoded = verifyAccessToken(token);
      req.user = decoded;
      req.headers["x-user-id"] = decoded.userId;
    }

    next();
  } catch (error) {
    // If token is invalid, just continue without user info
    next();
  }
};

/**
 * Middleware to extract user ID from token and add it to headers
 * This ensures rate limiting works with user ID
 */
export const extractUserIdFromToken = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  if (req.user?.userId) {
    req.headers["x-user-id"] = req.user.userId;
  }
  next();
};
