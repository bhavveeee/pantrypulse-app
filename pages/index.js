import { getToken } from "next-auth/jwt";

// Server-side gate on the root URL. Logged-in curiousinc users are sent
// straight into the app; everyone else goes to the login page.
export async function getServerSideProps(ctx) {
  const token = await getToken({
    req: ctx.req,
    secret: process.env.NEXTAUTH_SECRET,
  });
  const email = (token?.email || "").toLowerCase();
  const ok = token && email.endsWith("@curiousinc.com");
  return {
    redirect: { destination: ok ? "/api/app" : "/login", permanent: false },
  };
}

export default function Home() {
  return null;
}
