import { pathsToModuleNameMapper } from 'ts-jest';
import { compilerOptions } from './tsconfig.json';

export default {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths || {}, {
    prefix: '<rootDir>/',
  }),
  collectCoverageFrom: [
    '**/*.(t|j)s',
    '!**/*.module.ts',
    '!**/*.dto.ts',
    '!**/*.entity.ts',
    '!**/*.swagger.ts',
    '!**/*.types.ts',
    '!**/*.spec.ts',
    '!**/main.ts',
    '!**/migrations/**',
    '!**/scripts/**',
  ],
  coverageDirectory: './coverage',
  coverageThreshold: {
    global: {
      statements: 60,
      branches: 50,
      functions: 55,
      lines: 60,
    },
  },
  testEnvironment: 'node',
};
