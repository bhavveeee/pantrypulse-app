import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

// The ONLY email domain allowed to sign in.
const ALLOWED_DOMAIN = "curiousinc.com";

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      // hd hints Google to show only the workspace domain, but we still
      // enforce it server-side in signIn below (hd alone is NOT secure).
      authorization: {
        params: { hd: ALLOWED_DOMAIN, prompt: "select_account" },
      },
    }),
  ],
  callbacks: {
    // Hard gate: reject any account whose verified email is not @curiousinc.com.
    async signIn({ profile, account }) {
      const email = (profile?.email || "").toLowerCase();
      const verified =
        profile?.email_verified === true ||
        profile?.email_verified === "true";
      const domainOk = email.endsWith("@" + ALLOWED_DOMAIN);
      return Boolean(verified && domainOk);
    },
    async session({ session, token }) {
      if (session?.user) session.user.email = token.email;
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login", // send domain-rejected users back to login with ?error
  },
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
};

export default NextAuth(authOptions);
