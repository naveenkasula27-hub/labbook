import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { login } from "../lib/dash.js";

export default function LoginPage({ onLoggedIn }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  /**
   * The demo account, when one is set up. Someone arriving from an ad or a
   * portfolio has no reason to type a password to look at a sample lab, so
   * the button signs them straight in. The details are shown underneath as
   * well, so it is clear this is a real login and not a mockup.
   */
  const demoEmail = import.meta.env.VITE_DEMO_EMAIL || "";
  const demoPassword = import.meta.env.VITE_DEMO_PASSWORD || "";
  const hasDemo = Boolean(demoEmail && demoPassword);

  async function signIn(withEmail, withPassword) {
    setError("");
    setBusy(true);
    try {
      const data = await login(withEmail, withPassword);
      onLoggedIn?.(data);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err.message);
      setPassword("");
    } finally {
      setBusy(false);
    }
  }

  async function submit(e) {
    e.preventDefault();
    setError("");

    if (!email.trim()) return setError("Enter your email address.");
    if (!password) return setError("Enter your password.");

    await signIn(email.trim(), password);
  }

  return (
    <div className="login-wrap">
      <form className="card login-card" onSubmit={submit} noValidate>
        <h1>Lab sign in</h1>
        <p className="muted small">Sign in to see your bookings.</p>

        {error && (
          <div className="notice notice-bad" role="alert">
            {error}
          </div>
        )}

        <div>
          <label className="field-label" htmlFor="email">Email</label>
          <input
            id="email"
            className="input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
            autoFocus
          />
        </div>

        <div>
          <label className="field-label" htmlFor="password">Password</label>
          <input
            id="password"
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </div>

        <button className="btn btn-primary btn-block" type="submit" disabled={busy}>
          {busy ? "Signing in…" : "Sign in"}
        </button>

        <p className="muted tiny" style={{ margin: 0 }}>
          Forgotten your password? Contact whoever set up your account.
        </p>

        <p className="muted tiny" style={{ margin: 0 }}>
          Running a lab and new here? <Link to="/signup">Set up your own dashboard</Link>
        </p>

        {hasDemo && (
          <div className="demo-login">
            <p className="muted small">Just looking?</p>
            <button
              className="btn btn-block"
              type="button"
              disabled={busy}
              onClick={() => signIn(demoEmail, demoPassword)}
            >
              {busy ? "Opening…" : "Open the demo dashboard"}
            </button>
            <p className="muted tiny">
              Signs you into a sample lab. Nothing here belongs to a real business, so
              change whatever you like. It is put back every night.
            </p>
            <p className="muted tiny">
              {demoEmail} · {demoPassword}
            </p>
          </div>
        )}
      </form>
    </div>
  );
}
