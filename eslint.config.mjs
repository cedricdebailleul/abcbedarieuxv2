import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  {
    ignores: [
      "lib/generated/**/*",
      "lib/generated/**/*.js", 
      "lib/generated/**/*.d.ts",
      "**/.next/**",
      "**/node_modules/**"
    ]
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "warn", // Downgrade to warning
      "@typescript-eslint/no-unused-vars": "warn", // Downgrade to warning
      "react/no-unescaped-entities": "warn", // Downgrade to warning
      "@typescript-eslint/no-require-imports": "off" // Disable for generated files
    }
  }
];

export default eslintConfig;
