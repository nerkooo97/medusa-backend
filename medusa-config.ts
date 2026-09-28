import { loadEnv, defineConfig } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'production', process.cwd())

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    redisUrl: process.env.REDIS_URL,
    http: {
      storeCors: process.env.STORE_CORS || "http://localhost:8000,http://localhost:8001,http://alati.77.42.72.66.nip.io,https://alati.77.42.72.66.nip.io,http://medusajs-ljepota.77.42.72.66.nip.io,https://medusajs-ljepota.77.42.72.66.nip.io",
      adminCors: process.env.ADMIN_CORS || "http://localhost:9000,http://medusajs-backend.77.42.72.66.nip.io,https://medusajs-backend.77.42.72.66.nip.io",
      authCors: process.env.AUTH_CORS || "http://localhost:9000,http://medusajs-backend.77.42.72.66.nip.io,https://medusajs-backend.77.42.72.66.nip.io",
      jwtSecret: process.env.JWT_SECRET || "supersecret",
      cookieSecret: process.env.COOKIE_SECRET || "supersecret",
    },
    databaseDriverOptions: {
      ssl: false,
      sslmode: "disable",
    },
  },
  admin: {
    disable: false,
  },
})
