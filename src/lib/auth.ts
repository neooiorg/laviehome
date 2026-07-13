import { betterAuth } from "better-auth";
import { emailOTP } from "better-auth/plugins";
import { Pool } from "pg";
import { Resend } from "resend";
import { OtpEmail } from "@/emails/otp-email";
import { createElement } from "react";

export const auth = betterAuth({
  database: new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  }),
  plugins: [
    emailOTP({
      expiresIn: 60 * 10, // 10 minutes
      otpLength: 6,
      disableSignUp: true, // only pre-seeded users can log in
      sendVerificationOTP: async ({ email, otp, type }) => {
        if (type !== "sign-in") return;
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: "Lavie Home <onboarding@resend.dev>",
          to: email,
          subject: `${otp} - Mã đăng nhập Lavie Home`,
          react: createElement(OtpEmail, { otp }),
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
  verification: { modelName: "ba_verification" },
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;
