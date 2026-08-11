import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect } from "react";

export default function Login() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const rejected = router.query.error === "AccessDenied";

  // If already signed in with a valid session, go to the app.
  useEffect(() => {
    if (status === "authenticated") router.replace("/api/app");
  }, [status, router]);

  return (
    <div style={styles.wrap}>
      <div style={styles.card}>
        <div style={styles.logo}>🍅</div>
        <h1 style={styles.title}>PantryPulse</h1>
        <p style={styles.sub}>Curious Inc — internal access only</p>

        {rejected && (
          <div style={styles.error}>
            That account isn’t a <b>@curiousinc.com</b> address. Please sign in
            with your Curious Inc Google account.
          </div>
        )}

        <button
          style={styles.btn}
          onClick={() => signIn("google", { callbackUrl: "/api/app" })}
        >
          <span style={styles.g}>G</span> Sign in with Google
        </button>

        <p style={styles.note}>
          Only <b>@curiousinc.com</b> accounts are permitted.
        </p>
      </div>
    </div>
  );
}

const styles = {
  wrap: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#0f2e22",
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
  },
  card: {
    background: "#fff",
    padding: "40px 36px",
    borderRadius: 16,
    width: 360,
    textAlign: "center",
    boxShadow: "0 12px 40px rgba(0,0,0,.35)",
  },
  logo: { fontSize: 44, marginBottom: 8 },
  title: { margin: "0 0 4px", fontSize: 26, color: "#123", fontWeight: 800 },
  sub: { margin: "0 0 24px", color: "#667", fontSize: 14 },
  error: {
    background: "#fdeaea",
    color: "#a12",
    border: "1px solid #f3c2c2",
    padding: "10px 12px",
    borderRadius: 8,
    fontSize: 13,
    marginBottom: 18,
    textAlign: "left",
  },
  btn: {
    width: "100%",
    padding: "12px 16px",
    fontSize: 15,
    fontWeight: 600,
    color: "#123",
    background: "#fff",
    border: "1px solid #dadce0",
    borderRadius: 8,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  g: {
    fontWeight: 800,
    color: "#4285F4",
    fontSize: 18,
    fontFamily: "Georgia, serif",
  },
  note: { marginTop: 18, color: "#889", fontSize: 12 },
};
