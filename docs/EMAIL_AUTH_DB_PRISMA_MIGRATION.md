# Email Auth: DB and Prisma migration guide

This document explains the required database and Prisma changes for:

- Email verification before login
- Password recovery by one-time email token

## 1) What changed in Prisma schema

File updated: prisma/schema.prisma

### usuarios

- Added column: emailVerificado Boolean @default(true)

Why default true?

- Prevents existing users from being locked out at migration time.
- New users are explicitly created as emailVerificado = false in backend code, then verified by email link.

### New tables

- email_verification_tokens
  - id (uuid)
  - userId (FK -> usuarios.codUsuario)
  - tokenHash (sha256 hash of raw token)
  - expiresAt
  - consumedAt
  - createdAt

- password_reset_tokens
  - id (uuid)
  - userId (FK -> usuarios.codUsuario)
  - tokenHash (sha256 hash of raw token)
  - expiresAt
  - consumedAt
  - createdAt

## 2) SQL migration file

Prepared SQL migration:

- prisma/migrations/20260816_email_auth_tokens/migration.sql

This file adds:

- usuarios.emailVerificado
- email_verification_tokens table + indexes + FK
- password_reset_tokens table + indexes + FK

## 3) How to apply (recommended: Prisma)

Run from project root.

### Dev environment

1. Create/apply migration and regenerate Prisma Client:

   pnpm exec prisma migrate dev --name email_auth_tokens

2. Regenerate client if needed:

   pnpm exec prisma generate

3. Verify backend build:

   pnpm build:backend

### Staging/Production

1. Commit migrations first.
2. Apply migrations on target environment:

   pnpm exec prisma migrate deploy

3. Regenerate client in CI/build step if your pipeline requires it:

   pnpm exec prisma generate

## 4) How to apply manually (SQL fallback)

Use this only if Prisma migration flow is not available in your environment.

1. Execute:

   prisma/migrations/20260816_email_auth_tokens/migration.sql

2. Then regenerate Prisma client:

   pnpm exec prisma generate

3. Verify backend build:

   pnpm build:backend

## 5) Post-migration verification checklist

1. Schema objects exist:
   - usuarios.emailVerificado
   - email_verification_tokens
   - password_reset_tokens
2. Existing users can still log in.
3. New user registration stores emailVerificado = false.
4. Email verification token marks emailVerificado = true.
5. Password reset token is one-time and expires correctly.

## 6) Required env variables for email flow

Defined in .env.example:

- RESEND_API_KEY
- MAIL_FROM
- FRONTEND_URL or APP_BASE_URL
- EMAIL_VERIFICATION_TOKEN_TTL_MINUTES
- PASSWORD_RESET_TOKEN_TTL_MINUTES

## 7) Notes

- The current SQL assumes MySQL 8+ syntax.
- If your DB already has some of these objects, adjust SQL manually (or use Prisma migration status and drift tools).
