import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signup } from "../lib/dash.js";

/**
 * Self-serve sign-up: a lab owner creates their own account and lab here,
 * no one from UnityWebWorks has to do it by hand. They land on a trial plan
 * with no tests priced yet — the Prices tab in the dashboard is where they
 * add their own tests and rates, since nobody but the lab knows those.
 */
export default function SignupPage({ onLoggedIn }) {
  const navigate = useNavigate();
  const [labName, setLabName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError("");

    if (!labName.trim()) return setError("Enter your lab's name.");
    if (!ownerName.trim()) return setError("Enter your name.");
    if (!email.trim()) return setError("Enter your email address.");
    if (!phone.trim()) return setError("Enter a phone number.");
    if (password.length < 8) return setError("Password must be at least 8 characters.");

    setBusy(true);
    try {
      const data = await signup({
        labName: labName.trim(),
        ownerName: ownerName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        city: city.trim(),
        password,
      });
      onLoggedIn?.(data);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-wrap">
      <form className="card login-card" onSubmit={submit} noValidate>
        <h1>Set up your lab</h1>
        <p className="muted small">
          Create your dashboard. You'll start on a free trial — add your own tests
          and prices once you're in.
        </p>

        {error && (
          <div className="notice notice-bad" role="alert">
            {error}
          </div>
        )}

        <div>
          <label className="field-label" htmlFor="labName">Lab name</label>
          <input
            id="labName"
            className="input"
            type="text"
            value={labName}
            onChange={(e) => setLabName(e.target.value)}
            placeholder="e.g. Maheera Diagnostics"
            autoFocus
          />
        </div>

        <div>
          <label className="field-label" htmlFor="ownerName">Your name</label>
          <input
            id="ownerName"
            className="input"
            type="text"
            value={ownerName}
            onChange={(e) => setOwnerName(e.target.value)}
            autoComplete="name"
          />
        </div>

        <div>
          <label className="field-label" htmlFor="phone">Phone (shown to patients)</label>
          <input
            id="phone"
            className="input"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoComplete="tel"
          />
        </div>

        <div>
          <label className="field-label" htmlFor="city">City (optional)</label>
          <input
            id="city"
            className="input"
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
        </div>

        <div>
          <label className="field-label" htmlFor="email">Email</label>
          <input
            id="email"
            className="input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
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
            autoComplete="new-password"
          />
          <p className="muted tiny" style={{ margin: "4px 0 0" }}>At least 8 characters.</p>
        </div>

        <button className="btn btn-primary btn-block" type="submit" disabled={busy}>
          {busy ? "Setting up…" : "Create my dashboard"}
        </button>

        <p className="muted tiny" style={{ margin: 0 }}>
          Already have an account? <Link to="/dashboard">Sign in</Link>
        </p>
      </form>
    </div>
  );
}
