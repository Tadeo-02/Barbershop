-- Refresh tokens: replace unused token_blacklist with purpose-built refresh token table

-- Drop the dead token_blacklist table and its enum (never migrated, never used)
DROP TABLE IF EXISTS token_blacklist;
DROP TABLE IF EXISTS token_blacklist_reason;

-- Create refresh_tokens table (SHA-256 hashed tokens, same pattern as email_verification_tokens)
CREATE TABLE refresh_tokens (
  id VARCHAR(36) NOT NULL DEFAULT (uuid()),
  userId VARCHAR(36) NOT NULL,
  tokenHash VARCHAR(64) NOT NULL,
  expiresAt DATETIME(0) NOT NULL,
  revokedAt DATETIME(0) NULL,
  createdAt DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
  PRIMARY KEY (id),
  INDEX idx_refresh_tokens_user (userId),
  INDEX idx_refresh_tokens_hash (tokenHash),
  INDEX idx_refresh_tokens_expires (expiresAt),
  CONSTRAINT refresh_tokens_userId_fkey
    FOREIGN KEY (userId) REFERENCES usuarios(codUsuario)
    ON DELETE CASCADE
    ON UPDATE RESTRICT
);
