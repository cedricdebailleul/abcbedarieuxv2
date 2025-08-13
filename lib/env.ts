import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.string(),
    BETTER_AUTH_SECRET: z.string().min(1),

    GITHUB_CLIENT_ID: z.string().min(1),
    GITHUB_CLIENT_SECRET: z.string().min(1),

    GOOGLE_CLIENT_ID: z.string().min(1),
    GOOGLE_CLIENT_SECRET: z.string().min(1),

    MAIL_HOST: z.string().min(1),
    MAIL_PORT: z.coerce.number(),
    MAIL_USER: z.email(),
    MAIL_PASS: z.string().min(1),

    ARCJET_KEY: z.string().min(1),

    AWS_ACCESS_KEY_ID: z.string().min(1),
    AWS_SECRET_ACCESS_KEY: z.string().min(1),
    AWS_ENDPOINT_URL_S3: z.string(),
    AWS_ENDPOINT_URL_IAM: z.string(),
    AWS_REGION: z.string().min(1),

    DATA_RETENTION_DAYS: z.coerce.number().min(1),
    GDPR_NOTIFICATION_EMAIL: z.string().min(1),
  },

  client: {
    NEXT_PUBLIC_URL: z.string().min(1),
    NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES: z.string().min(1),
    NEXT_PUBLIC_S3_BUCKET_NAME_VIDEOS: z.string().min(1),
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: z.string().min(1),
    NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID: z.string().min(1),
    NEXT_PUBLIC_PRIVACY_POLICY_URL: z.string().min(1),
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

    ARCJET_KEY: process.env.ARCJET_KEY,

    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
    AWS_ENDPOINT_URL_S3: process.env.AWS_ENDPOINT_URL_S3,
    AWS_ENDPOINT_URL_IAM: process.env.AWS_ENDPOINT_URL_IAM,
    AWS_REGION: process.env.AWS_REGION,
    NEXT_PUBLIC_URL: process.env.NEXT_PUBLIC_URL,
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID: process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID,

    NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES: process.env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES,
    NEXT_PUBLIC_S3_BUCKET_NAME_VIDEOS: process.env.NEXT_PUBLIC_S3_BUCKET_NAME_VIDEOS,
    GDPR_NOTIFICATION_EMAIL: process.env.GDPR_NOTIFICATION_EMAIL,
    NEXT_PUBLIC_PRIVACY_POLICY_URL: process.env.NEXT_PUBLIC_PRIVACY_POLICY_URL,
    DATA_RETENTION_DAYS: process.env.DATA_RETENTION_DAYS,
  },

  skipValidation: process.env.SKIP_ENV_VALIDATION === "true",
});
