import rateLimit from "express-rate-limit";
import { Request } from "express";

/**
 * Generador de clave para usuarios autenticados
 * Usa el ID de usuario del header x-user-id, con fallback a una constante
 */
const userIdKeyGenerator = (req: Request): string => {
  const userId = req.header("x-user-id");
  if (userId) {
    return `user:${userId}`;
  }
  // Fallback a unknown si no hay ID de usuario (no debería ocurrir en rutas autenticadas)
  // No usamos IP aquí porque este limitador es para usuarios autenticados
  return "user:unknown";
};

/**
 * Limitador general para todos los endpoints de la API
 * Límite: 100 solicitudes cada 15 minutos por IP
 */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Máximo 100 solicitudes por IP por ventana de tiempo
  message: {
    success: false,
    message:
      "Demasiadas solicitudes desde esta IP, por favor intente más tarde.",
  },
  standardHeaders: true, // Devuelve info del límite en los headers `RateLimit-*`
  legacyHeaders: false, // Deshabilita los headers `X-RateLimit-*`
  // No omitir solicitudes exitosas
  skipSuccessfulRequests: false,
  // No omitir solicitudes fallidas
  skipFailedRequests: false,
});

/**
 * Limitador estricto para endpoints de autenticación (login, registro)
 * Límite: 5 solicitudes cada 15 minutos por IP
 * Previene ataques de fuerza bruta y registros masivos
 * Usa limitación por IP (para usuarios no autenticados)
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // Máximo 5 solicitudes por IP por ventana de tiempo
  message: {
    success: false,
    message:
      "Demasiados intentos de autenticación. Por favor, intente nuevamente en 15 minutos.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  // No contar las solicitudes exitosas contra el límite
  skipSuccessfulRequests: true,
});

/**
 * Limitador moderado para endpoints de modificación de datos
 * Límite: 20 solicitudes cada 5 minutos por IP (para usuarios no autenticados)
 * Previene el abuso en operaciones de creación, actualización y eliminación
 * @deprecated Usar userModificationLimiter para endpoints autenticados
 */
export const modificationLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutos
  max: 20, // Máximo 20 solicitudes por IP por ventana de tiempo
  message: {
    success: false,
    message:
      "Demasiadas solicitudes de modificación. Por favor, espere unos minutos.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Limitador de modificación basado en usuario (usuarios autenticados)
 * Límite: 30 solicitudes cada 5 minutos por ID de usuario
 * Previene el abuso en operaciones de creación, actualización y eliminación
 */
export const userModificationLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutos
  max: 30, // Máximo 30 solicitudes por usuario por ventana de tiempo (mayor que el basado en IP)
  message: {
    success: false,
    message:
      "Demasiadas solicitudes de modificación. Por favor, espere unos minutos.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: userIdKeyGenerator,
});

/**
 * Limitador muy estricto para operaciones sensibles (recuperación de contraseña, etc.)
 * Límite: 3 solicitudes cada 60 minutos por IP (para usuarios no autenticados)
 * @deprecated Usar userSensitiveLimiter para endpoints autenticados
 */
export const sensitiveLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 60 minutos
  max: 3, // Máximo 3 solicitudes por IP por ventana de tiempo
  message: {
    success: false,
    message:
      "Ha excedido el límite de intentos para esta operación. Intente nuevamente en 1 hora.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Limitador estricto basado en usuario para operaciones sensibles (usuarios autenticados)
 * Límite: 5 solicitudes cada 60 minutos por ID de usuario
 * Usar para operaciones relacionadas con seguridad en usuarios autenticados
 */
export const userSensitiveLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 60 minutos
  max: 5, // Máximo 5 solicitudes por usuario por ventana de tiempo
  message: {
    success: false,
    message:
      "Ha excedido el límite de intentos para esta operación. Intente nuevamente en 1 hora.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: userIdKeyGenerator,
});

/**
 * Limitador estándar basado en usuario para operaciones autenticadas
 * Límite: 100 solicitudes cada 15 minutos por ID de usuario
 * Usar para endpoints autenticados en general (GET, POST, PUT, DELETE)
 */
export const userLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Máximo 100 solicitudes por usuario por ventana de tiempo
  message: {
    success: false,
    message: "Demasiadas solicitudes. Por favor, intente más tarde.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: userIdKeyGenerator,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
});

/**
 * Limitador de lectura pública para endpoints GET no autenticados (ej. datos de la landing page)
 * Usa clave por IP. Permite 300 solicitudes cada 15 minutos por IP.
 * Omite las solicitudes exitosas, por lo que solo los errores cuentan contra el límite.
 */
export const publicReadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 300,
  message: {
    success: false,
    message: "Demasiadas solicitudes. Por favor, intente más tarde.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});
