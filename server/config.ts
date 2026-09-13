import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  APP_ORIGIN: z.url(),
  DATABASE_URL: z.string().min(1),
  HOST: z.string().default('127.0.0.1'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3001),
});

export function readConfig(env: NodeJS.ProcessEnv = process.env) {
  const parsed = schema.safeParse(env);
  if (!parsed.success) {
    throw new Error(`Configuración inválida: ${parsed.error.issues.map(i => i.path.join('.')).join(', ')}`);
  }
  const config = parsed.data;
  const origin = new URL(config.APP_ORIGIN);
  const database = new URL(config.DATABASE_URL);
  if (origin.origin !== config.APP_ORIGIN || origin.username || origin.password) {
    throw new Error('APP_ORIGIN debe ser un origen exacto, sin ruta ni credenciales.');
  }
  if (!['postgres:', 'postgresql:'].includes(database.protocol)) {
    throw new Error('DATABASE_URL debe apuntar a PostgreSQL.');
  }
  if (config.NODE_ENV === 'production') {
    if (origin.protocol !== 'https:') throw new Error('Producción requiere APP_ORIGIN HTTPS.');
    if (!['require', 'verify-full'].includes(database.searchParams.get('sslmode') ?? '')) {
      throw new Error('Producción requiere sslmode=require o sslmode=verify-full en DATABASE_URL.');
    }
  }
  return config;
}
