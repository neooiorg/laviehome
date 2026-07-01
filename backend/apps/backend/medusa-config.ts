import { loadEnv, defineConfig } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())
if (!process.env.JWT_SECRET) {
  loadEnv('development', process.cwd())
}

module.exports = defineConfig({
  modules: [
    {
      resolve: "@medusajs/medusa/file",
      options: {
        providers: [
          {
            resolve: "@medusajs/medusa/file-local",
            id: "local",
            options: {
              // uploads/ path inside .medusa/server — must be mounted as a Dokploy volume
              upload_dir: "uploads",
              // BACKEND_URL phải set trong Dokploy env để image URL trả về đúng host
              backend_url: process.env.BACKEND_URL || process.env.MEDUSA_BACKEND_URL || "http://localhost:9000",
            },
          },
        ],
      },
    },
  ],
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    databaseDriverOptions: (process.env.DATABASE_URL?.includes('neon.tech') || process.env.DATABASE_URL?.includes('sslmode=require')) ? {
      connection: {
        ssl: { rejectUnauthorized: false }
      },
      pool: {
        min: 0,
        max: 2,
        idleTimeoutMillis: 500
      }
    } : {
      pool: {
        min: 0,
        max: 2,
        idleTimeoutMillis: 500
      }
    },
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET,
      cookieSecret: process.env.COOKIE_SECRET,
    },
    cookieOptions: {
      // Domain hiện chạy HTTP (chưa có TLS), nên cookie phải bỏ cờ Secure
      // để trình duyệt chấp nhận lưu sau khi login. Bật lại true khi có HTTPS.
      secure: process.env.COOKIE_SECURE === 'true',
    }
  }
})
