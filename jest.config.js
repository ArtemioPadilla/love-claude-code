/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/frontend', '<rootDir>/backend', '<rootDir>/packages'],
  testMatch: [
    '**/__tests__/**/*.+(ts|tsx|js)',
    '**/?(*.)+(spec|test).+(ts|tsx|js)',
  ],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  collectCoverageFrom: [
    '**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/build/**',
    '!**/coverage/**',
    '!**/*.config.{js,ts}',
    '!**/tests/**',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  moduleNameMapper: {
    '^@frontend/(.*)$': '<rootDir>/frontend/src/$1',
    '^@backend/(.*)$': '<rootDir>/backend/src/$1',
    '^@shared/(.*)$': '<rootDir>/packages/shared/src/$1',
    '^@types/(.*)$': '<rootDir>/packages/types/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '/build/'],
  verbose: true,
  projects: [
    {
      displayName: 'frontend',
      testEnvironment: 'jsdom',
      testMatch: ['<rootDir>/frontend/**/*.test.{ts,tsx}'],
      setupFilesAfterEnv: ['<rootDir>/frontend/jest.setup.js'],
    },
    {
      displayName: 'backend',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/backend/**/*.test.{ts,tsx}'],
      setupFilesAfterEnv: ['<rootDir>/backend/jest.setup.js'],
    },
    {
      displayName: 'packages',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/packages/**/*.test.{ts,tsx}'],
    },
  ],
};