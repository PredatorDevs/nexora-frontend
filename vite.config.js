import { fileURLToPath, URL } from 'node:url';

import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

import { parseEnvironment } from './src/config/environment-schema.js';

const DEFAULT_DEV_API_PROXY_TARGET = 'http://localhost:3000';
const testEnvironment = Object.freeze({
  VITE_APP_NAME: 'Nexora ERP',
  VITE_API_BASE_URL: '/api/v1',
  VITE_REQUEST_TIMEOUT: '15000',
  VITE_ENABLE_AUDIT_MODULE: 'true',
});

function parseDevApiProxyTarget(value) {
  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error();
    return url.toString().replace(/\/$/, '');
  } catch {
    throw new Error(
      'Configuración de entorno inválida: DEV_API_PROXY_TARGET debe ser una URL HTTP(S).',
    );
  }
}

export default defineConfig(({ mode }) => {
  const processEnvironment = loadEnv(mode, process.cwd(), '');
  const browserEnvironment =
    mode === 'test' ? testEnvironment : processEnvironment;

  parseEnvironment(browserEnvironment);

  const apiProxyTarget = parseDevApiProxyTarget(
    processEnvironment.DEV_API_PROXY_TARGET || DEFAULT_DEV_API_PROXY_TARGET,
  );

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      proxy: {
        '/api': {
          target: apiProxyTarget,
          changeOrigin: true,
        },
      },
    },
    build: {
      sourcemap: false,
    },
    test: {
      pool: 'forks',
      maxWorkers: 2,
      environment: 'jsdom',
      globals: true,
      include: ['tests/{unit,integration}/**/*.{test,spec}.{js,jsx}'],
      setupFiles: ['./tests/setup/setup-tests.js'],
      testTimeout: 10_000,
      css: true,
      env: testEnvironment,
      coverage: {
        provider: 'v8',
        include: ['src/**/*.{js,jsx}'],
        exclude: ['tests/**'],
        reporter: ['text', 'html'],
        reportsDirectory: './coverage',
        thresholds: {
          statements: 50,
          branches: 40,
          functions: 40,
          lines: 50,
        },
      },
    },
  };
});
