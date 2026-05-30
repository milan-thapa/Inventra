// src/lib/env.ts
/**
 * Environment variable validation
 * Ensures all required environment variables are set at runtime
 */

const requiredEnvVars = {
  DATABASE_URL: "Database connection string",
  AUTH_SECRET: "NextAuth secret key",
  AUTH_URL: "Application URL for auth callbacks",
  AUTH_GOOGLE_ID: "Google OAuth client ID",
  AUTH_GOOGLE_SECRET: "Google OAuth client secret",
  AUTH_GITHUB_ID: "GitHub OAuth client ID",
  AUTH_GITHUB_SECRET: "GitHub OAuth client secret",
  RESEND_API_KEY: "Resend email API key",
  UPLOADTHING_SECRET: "UploadThing secret key",
  UPLOADTHING_APP_ID: "UploadThing app ID",
} as const;

const optionalEnvVars = {
  RESEND_FROM_EMAIL: "Default sender email (defaults to noreply@inventra.com)",
  NEXT_PUBLIC_APP_URL: "Public application URL",
  NEXT_PUBLIC_APP_NAME: "Application name",
} as const;

type EnvVar = keyof typeof requiredEnvVars | keyof typeof optionalEnvVars;

export function validateEnv(): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check required environment variables
  for (const [key, description] of Object.entries(requiredEnvVars)) {
    if (!process.env[key]) {
      errors.push(`Missing required environment variable: ${key} (${description})`);
    }
  }

  // Check optional environment variables
  for (const [key, description] of Object.entries(optionalEnvVars)) {
    if (!process.env[key]) {
      warnings.push(`Optional environment variable not set: ${key} (${description})`);
    }
  }

  // Validate URL formats
  if (process.env.AUTH_URL && !isValidUrl(process.env.AUTH_URL)) {
    errors.push(`Invalid AUTH_URL format: ${process.env.AUTH_URL}`);
  }

  if (process.env.NEXT_PUBLIC_APP_URL && !isValidUrl(process.env.NEXT_PUBLIC_APP_URL)) {
    errors.push(`Invalid NEXT_PUBLIC_APP_URL format: ${process.env.NEXT_PUBLIC_APP_URL}`);
  }

  // Validate database URL
  if (process.env.DATABASE_URL && !process.env.DATABASE_URL.startsWith("postgresql://")) {
    errors.push(`DATABASE_URL must be a PostgreSQL connection string`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function getEnvVar(key: EnvVar): string | undefined {
  return process.env[key];
}

export function getRequiredEnvVar(key: keyof typeof requiredEnvVars): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

// Validate environment on module load (only in production)
if (process.env.NODE_ENV === "production") {
  const validation = validateEnv();
  if (!validation.valid) {
    console.error("❌ Environment validation failed:");
    validation.errors.forEach((error) => console.error(`  - ${error}`));
    throw new Error("Invalid environment configuration");
  }
  if (validation.warnings.length > 0) {
    console.warn("⚠️  Environment warnings:");
    validation.warnings.forEach((warning) => console.warn(`  - ${warning}`));
  }
}
