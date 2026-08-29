module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/(validation|data|nutrition)/**/*.test.ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: { module: 'commonjs' } }],
  },
};
