import { parseEnvironment } from '@/config/environment-schema.js';

export const environment = parseEnvironment(import.meta.env);
