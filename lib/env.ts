import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().min(1),
    BETTER_AUTH_SECRET: z.string().min(32, "BETTER_AUTH_SECRET must be at least 32 characters"),

    GITHUB_CLIENT_ID: z.string().optional(),
    GITHUB_CLIENT_SECRET: z.string().optional(),

    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),

    MAIL_HOST: z.string().optional(),
    MAIL_PORT: z.coerce.number().optional(),
    MAIL_USER: z.string().optional(),
    MAIL_PASS: z.string().optional(),

    SMTP_HOST: z.string().optional(),
    SMTP_PORT: z.coerce.number().optional(),
    SMTP_SECURE: z.coerce.boolean().optional(),
    SMTP_USER: z.string().optional(),
    SMTP_PASSWORD: z.string().optional(),
    SMTP_FROM: z.string().optional(),
    CONTACT_EMAIL: z.string().optional(),

    ARCJET_KEY: z.string().optional(),

    AWS_ACCESS_KEY_ID: z.string().optional(),
    AWS_SECRET_ACCESS_KEY: z.string().optional(),
    AWS_ENDPOINT_URL_S3: z.string().optional(),
    AWS_ENDPOINT_URL_IAM: z.string().optional(),
    AWS_REGION: z.string().optional(),

    DATA_RETENTION_DAYS: z.coerce.number().optional(),
    GDPR_NOTIFICATION_EMAIL: z.string().optional(),

    WHATSAPP_VERIFY_TOKEN: z.string().optional(),
    WHATSAPP_ACCESS_TOKEN: z.string().optional(),
    WHATSAPP_PHONE_NUMBER_ID: z.string().optional(),
    WHATSAPP_WEBHOOK_SECRET: z.string().optional(),
  },

  client: {
    NEXT_PUBLIC_URL: z.string().optional(),
    NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES: z.string().optional(),
    NEXT_PUBLIC_S3_BUCKET_NAME_VIDEOS: z.string().optional(),
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: z.string().min(1),
    NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID: z.string().optional(),
    NEXT_PUBLIC_WHATSAPP_NUMBER: z.string().optional(),
    NEXT_PUBLIC_PRIVACY_POLICY_URL: z.string().optional(),
  },

  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,

    GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,

    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,

    MAIL_HOST: process.env.MAIL_HOST,
    MAIL_PORT: process.env.MAIL_PORT,
    MAIL_USER: process.env.MAIL_USER,
    MAIL_PASS: process.env.MAIL_PASS,

    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT,
    SMTP_SECURE: process.env.SMTP_SECURE,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASSWORD: process.env.SMTP_PASSWORD,
    SMTP_FROM: process.env.SMTP_FROM,
    CONTACT_EMAIL: process.env.CONTACT_EMAIL,

    ARCJET_KEY: process.env.ARCJET_KEY,

    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
    AWS_ENDPOINT_URL_S3: process.env.AWS_ENDPOINT_URL_S3,
    AWS_ENDPOINT_URL_IAM: process.env.AWS_ENDPOINT_URL_IAM,
    AWS_REGION: process.env.AWS_REGION,
    NEXT_PUBLIC_URL: process.env.NEXT_PUBLIC_URL,
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY:
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID: process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID,

    NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES:
      process.env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES,
    NEXT_PUBLIC_S3_BUCKET_NAME_VIDEOS:
      process.env.NEXT_PUBLIC_S3_BUCKET_NAME_VIDEOS,
    GDPR_NOTIFICATION_EMAIL: process.env.GDPR_NOTIFICATION_EMAIL,
    NEXT_PUBLIC_PRIVACY_POLICY_URL: process.env.NEXT_PUBLIC_PRIVACY_POLICY_URL,
    NEXT_PUBLIC_WHATSAPP_NUMBER: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER,
    DATA_RETENTION_DAYS: process.env.DATA_RETENTION_DAYS,
    WHATSAPP_VERIFY_TOKEN: process.env.WHATSAPP_VERIFY_TOKEN,
    WHATSAPP_ACCESS_TOKEN: process.env.WHATSAPP_ACCESS_TOKEN,
    WHATSAPP_PHONE_NUMBER_ID: process.env.WHATSAPP_PHONE_NUMBER_ID,
    WHATSAPP_WEBHOOK_SECRET: process.env.WHATSAPP_WEBHOOK_SECRET,
    
  },

  skipValidation: process.env.SKIP_ENV_VALIDATION === "true" && process.env.NODE_ENV !== "production",
});
