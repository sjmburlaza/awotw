import preset from 'jest-preset-angular/presets/index.js';

const { createCjsPreset } = preset;

export default {
  ...createCjsPreset(),
  setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],
  testMatch: ['<rootDir>/src/**/*.spec.ts'],
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/src/$1',
    '^d3$': '<rootDir>/test/mocks/d3.ts',
    '^globe\\.gl$': '<rootDir>/test/mocks/globe-gl.ts',
    '^ng2-charts$': '<rootDir>/test/mocks/ng2-charts.ts',
    '^chartjs-plugin-datalabels$': '<rootDir>/test/mocks/chartjs-plugin-datalabels.ts',
  },
};
