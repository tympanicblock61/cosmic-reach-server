module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    moduleFileExtensions: ['ts', 'js'],
    transform: {
        '^.+\\.tsx?$': 'ts-jest', // Transform .ts and .tsx files using ts-jest
    },
    testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'], // Look for tests with `.ts`, `.spec.ts`, or `.test.ts` extensions
};
