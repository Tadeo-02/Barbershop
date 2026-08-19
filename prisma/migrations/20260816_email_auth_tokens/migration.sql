-- Email verification and password reset token migration
-- Safe to run once in MySQL 8+

ALTER TABLE usuarios
  ADD COLUMN emailVerificado BOOLEAN NOT NULL DEFAULT true;

CREATE TABLE email_verification_tokens (
  id VARCHAR(36) NOT NULL DEFAULT (uuid()),
  userId VARCHAR(36) NOT NULL,
  tokenHash VARCHAR(64) NOT NULL,
  expiresAt DATETIME(0) NOT NULL,
  consumedAt DATETIME(0) NULL,
  createdAt DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
  PRIMARY KEY (id),
  INDEX idx_email_verification_user (userId),
  INDEX idx_email_verification_hash (tokenHash),
  INDEX idx_email_verification_expires (expiresAt),
  CONSTRAINT email_verification_tokens_userId_fkey
    FOREIGN KEY (userId) REFERENCES usuarios(codUsuario)
    ON DELETE CASCADE
    ON UPDATE RESTRICT
);

CREATE TABLE password_reset_tokens (
  id VARCHAR(36) NOT NULL DEFAULT (uuid()),
  userId VARCHAR(36) NOT NULL,
  tokenHash VARCHAR(64) NOT NULL,
  expiresAt DATETIME(0) NOT NULL,
  consumedAt DATETIME(0) NULL,
  createdAt DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
  PRIMARY KEY (id),
  INDEX idx_password_reset_user (userId),
  INDEX idx_password_reset_hash (tokenHash),
  INDEX idx_password_reset_expires (expiresAt),
  CONSTRAINT password_reset_tokens_userId_fkey
    FOREIGN KEY (userId) REFERENCES usuarios(codUsuario)
    ON DELETE CASCADE
    ON UPDATE RESTRICT
);