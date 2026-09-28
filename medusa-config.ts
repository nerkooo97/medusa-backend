import { loadEnv, defineConfig } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'production', process.cwd())

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    redisUrl: process.env.REDIS_URL,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET!,
      cookieSecret: process.env.COOKIE_SECRET!,
    },
    databaseDriverOptions: {
      ssl: false,
      sslmode: "disable",
    },
    cookieOptions: {
      secure: process.env.COOKIE_SECURE === "true",
      sameSite: (process.env.COOKIE_SAME_SITE as "lax" | "strict" | "none") || "lax",
    },
  },
  admin: {
    disable: false,
  },
})
