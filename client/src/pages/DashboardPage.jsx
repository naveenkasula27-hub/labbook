import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { me, clearToken, getToken } from "../lib/dash.js";
import BookingsPage from "./BookingsPage.jsx";
import PricesPage from "./PricesPage.jsx";
import SettingsPage from "./SettingsPage.jsx";
import LoginPage from "./LoginPage.jsx";

const TABS = [
  { key: "bookings", label: "Bookings" },
  { key: "prices", label: "Prices" },
  { key: "settings", label: "Settings" },
];

export default function DashboardPage() {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [checking, setChecking] = useState(true);
  const [tab, setTab] = useState("bookings");

  // On load, check whether the stored token is still valid.
  useEffect(() => {
    let alive = true;
    if (!getToken()) {
      setChecking(false);
      return;
    }
    me()
      .then((data) => alive && setSession(data))
      .catch(() => alive && setSession(null))
      .finally(() => alive && setChecking(false));
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (session?.lab) document.title = `${session.lab.name} — bookings`;
  }, [session]);

  function signOut() {
    clearToken();
    setSession(null);
    navigate("/dashboard", { replace: true });
  }

  if (checking) {
    return (
      <main className="center dash-root">
        <p className="muted">Checking your sign in…</p>
      </main>
    );
  }

  if (!session) {
    return (
      <div className="dash-root">
        <LoginPage onLoggedIn={setSession} />
      </div>
    );
  }

  const lab = session.lab;

  return (
    <div className="dash-root">
      <header className="dash-head">
        <div className="wrap dash-head-row">
          <div>
            <h1>{lab?.name || "Dashboard"}</h1>
            <p className="muted small" style={{ margin: 0 }}>
              Signed in as {session.user.email}
            </p>
          </div>
          <div className="dash-head-actions">
            {lab?.slug && (
              <a
                className="btn btn-ghost btn-sm"
                href={`/${lab.slug}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                View booking page
              </a>
            )}
            <button type="button" className="btn btn-ghost btn-sm" onClick={signOut}>
              Sign out
            </button>
          </div>
        </div>

        <div className="wrap">
          <nav className="tabs" aria-label="Dashboard sections">
            {TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                className="tab"
                aria-current={tab === t.key ? "page" : undefined}
                onClick={() => setTab(t.key)}
              >
                {t.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

           <main className="wrap dash-main">
        {lab?.billing?.status === "overdue" && (
          <div className="notice notice-warn" role="status">
            Payment is due for this account. Message UnityWebWorks on WhatsApp
            (77290 69137) to settle it and keep the dashboard and booking page
            running without interruption.
          </div>
        )}
        {tab === "bookings" && (
          <div className="tab-panel">
            <BookingsPage lab={lab} />
          </div>
        )}
        {tab === "prices" && (
          <div className="tab-panel">
            <PricesPage lab={lab} />
          </div>
        )}
        {tab === "settings" && (
          <div className="tab-panel">
            <SettingsPage lab={lab} onSaved={(l) => setSession((s) => ({ ...s, lab: { ...s.lab, ...l } }))} />
          </div>
        )}
      </main>
    </div>
  );
}
