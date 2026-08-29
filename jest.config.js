module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/validation/**/*.test.ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: { module: 'commonjs' } }],
  },
};
