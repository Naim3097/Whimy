/**
 * Service registry. Swap the mock for a real adapter here once the backend
 * is chosen, e.g.:
 *
 *   export const services = env.dataSource === 'api'
 *     ? createApiServices({ baseUrl: import.meta.env.VITE_API_URL })
 *     : createMockServices({ latencyMs: env.mockLatencyMs });
 */
import { env } from '../config/site';
import { createMockServices } from './mock';
import type { Services } from './types';

export const services: Services = createMockServices({ latencyMs: env.mockLatencyMs });

export type { Services } from './types';
export { OrderError } from './types';
