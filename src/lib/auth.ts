import { createElement } from "react";
import { betterAuth } from "better-auth";
import { emailOTP } from "better-auth/plugins";
import { Pool } from "pg";
import { Resend } from "resend";

import { OtpEmail } from "@/emails/otp-email";
import { getEmailFrom, getResendErrorMessage } from "@/lib/email-sender";

export const auth = betterAuth({
  database: new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.PGSSL === "false" ? false : { rejectUnauthorized: false },
  }),
  plugins: [
    emailOTP({
      expiresIn: 60 * 10,
      otpLength: 6,
      disableSignUp: true,
      sendVerificationOTP: async ({ email, otp, type }) => {
        if (type !== "sign-in") return;
        if (!process.env.RESEND_API_KEY) {
          throw new Error("RESEND_API_KEY is not configured");
        }

        const resend = new Resend(process.env.RESEND_API_KEY);
        const { error } = await resend.emails.send({
          from: getEmailFrom(),
          to: email,
          subject: `${otp} - Mã đăng nhập Lavie Home`,
          react: createElement(OtpEmail, { otp }),
        });

        if (error) {
          throw new Error(`Resend failed: ${getResendErrorMessage(error)}`);
        }
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
