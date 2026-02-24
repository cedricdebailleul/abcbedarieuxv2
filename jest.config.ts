import type { Config } from "jest";

const config: Config = {
  testEnvironment: "node",
  transform: {
    "^.+\\.tsx?$": ["ts-jest", {
      tsconfig: "tsconfig.json",
    }],
  },
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  testMatch: ["<rootDir>/__tests__/**/*.test.ts", "<rootDir>/__tests__/**/*.test.tsx"],
  setupFiles: ["<rootDir>/__tests__/setup.ts"],
};

export default config;
