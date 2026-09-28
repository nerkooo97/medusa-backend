"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("@medusajs/framework/utils");
(0, utils_1.loadEnv)(process.env.NODE_ENV || 'production', process.cwd());
module.exports = (0, utils_1.defineConfig)({
    projectConfig: {
        databaseUrl: process.env.DATABASE_URL,
        redisUrl: process.env.REDIS_URL,
        http: {
            storeCors: process.env.STORE_CORS,
            adminCors: process.env.ADMIN_CORS,
            authCors: process.env.AUTH_CORS,
            jwtSecret: process.env.JWT_SECRET,
            cookieSecret: process.env.COOKIE_SECRET,
        },
        databaseDriverOptions: {
            ssl: false,
            sslmode: "disable",
        },
        cookieOptions: {
            secure: process.env.COOKIE_SECURE === "true",
            sameSite: process.env.COOKIE_SAME_SITE || "lax",
        },
    },
    admin: {
        disable: false,
    },
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVkdXNhLWNvbmZpZy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL21lZHVzYS1jb25maWcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxxREFBaUU7QUFFakUsSUFBQSxlQUFPLEVBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxRQUFRLElBQUksWUFBWSxFQUFFLE9BQU8sQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFBO0FBRTVELE1BQU0sQ0FBQyxPQUFPLEdBQUcsSUFBQSxvQkFBWSxFQUFDO0lBQzVCLGFBQWEsRUFBRTtRQUNiLFdBQVcsRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLFlBQVk7UUFDckMsUUFBUSxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsU0FBUztRQUMvQixJQUFJLEVBQUU7WUFDSixTQUFTLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxVQUFXO1lBQ2xDLFNBQVMsRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLFVBQVc7WUFDbEMsUUFBUSxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsU0FBVTtZQUNoQyxTQUFTLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxVQUFXO1lBQ2xDLFlBQVksRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLGFBQWM7U0FDekM7UUFDRCxxQkFBcUIsRUFBRTtZQUNyQixHQUFHLEVBQUUsS0FBSztZQUNWLE9BQU8sRUFBRSxTQUFTO1NBQ25CO1FBQ0QsYUFBYSxFQUFFO1lBQ2IsTUFBTSxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsYUFBYSxLQUFLLE1BQU07WUFDNUMsUUFBUSxFQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsZ0JBQThDLElBQUksS0FBSztTQUMvRTtLQUNGO0lBQ0QsS0FBSyxFQUFFO1FBQ0wsT0FBTyxFQUFFLEtBQUs7S0FDZjtDQUNGLENBQUMsQ0FBQSJ9