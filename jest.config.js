/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.ts'],
  verbose: true,
  forceExit: true,
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  transform: {
    '^.+\\.ts'
: ['ts-jest', {
      tsconfig: 'tsconfig.json',
    }],
  },
  testTimeout: 10000 // Increase timeout to 10 seconds
};