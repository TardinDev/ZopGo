import type { Config } from "jest";

/**
 * Jest config for admin-ZopGo (Vite + React + TypeScript).
 *
 * The admin app uses Vite at build time, so Jest is here purely as a
 * unit-test runner — we don't try to mirror Vite's bundling. ts-jest
 * compiles .ts/.tsx on the fly; jsdom provides a DOM so React Testing
 * Library can render components.
 *
 * The `@/...` alias mirrors tsconfig.json so test code can import from
 * the same paths the app uses.
 */
const config: Config = {
    preset: "ts-jest",
    testEnvironment: "jsdom",
    roots: ["<rootDir>/src"],
    testMatch: ["**/__tests__/**/*.test.ts?(x)", "**/?(*.)+(spec|test).ts?(x)"],
    moduleNameMapper: {
        // Path alias — mirrors tsconfig's paths
        "^@/(.*)$": "<rootDir>/src/$1",
        // CSS / asset imports get stubbed so component tests don't choke
        "\\.(css|less|scss|sass)$": "identity-obj-proxy",
        "\\.(jpg|jpeg|png|gif|webp|svg)$": "<rootDir>/jest.fileStub.ts",
    },
    setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
    transform: {
        "^.+\\.tsx?$": [
            "ts-jest",
            {
                tsconfig: {
                    jsx: "react-jsx",
                    esModuleInterop: true,
                    allowSyntheticDefaultImports: true,
                },
            },
        ],
    },
    // antd ships ESM-only sub-paths; let ts-jest transpile them.
    transformIgnorePatterns: ["/node_modules/(?!(antd|@ant-design|rc-.+|@babel/runtime)/)"],
};

export default config;
