import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../lib/dash.js";

export default function LoginPage({ onLoggedIn }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError("");

    if (!email.trim()) return setError("Enter your email address.");
    if (!password) return setError("Enter your password.");

    setBusy(true);
    try {
      const data = await login(email.trim(), password);
      onLoggedIn?.(data);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err.message);
      setPassword("");
    } finally {
      setBusy(false);
    }
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
      </form>
    </div>
  );
}
