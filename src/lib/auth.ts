import { betterAuth } from "better-auth";
import { magicLink } from "better-auth/plugins";
import { Pool } from "pg";
import { Resend } from "resend";
import { MagicLinkEmail } from "@/emails/magic-link-email";
import { createElement } from "react";

export const auth = betterAuth({
  database: new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  }),
  plugins: [
    magicLink({
      expiresIn: 60 * 15, // 15 minutes
      disableSignUp: true, // only pre-seeded users can log in
      sendMagicLink: async ({ email, url }) => {
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: "Lavie Home <noreply@laviehome.vn>",
          to: email,
          subject: "Đăng nhập vào Lavie Home Dashboard",
          react: createElement(MagicLinkEmail, { url }),
        });
      },
    }),
  ],
  user: {
    modelName: "auth_user",
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "member",
      },
    },
  },
  session: { modelName: "auth_session" },
  account: { modelName: "auth_account" },
  verification: { modelName: "auth_verification" },
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;
