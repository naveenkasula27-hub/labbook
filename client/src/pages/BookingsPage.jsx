import { useCallback, useEffect, useState } from "react";
import {
  getBookings,
  getSummary,
  setStatus,
  setLabNotes,
  STATUS_LABELS,
  NEXT_STATUS,
} from "../lib/dash.js";
import { money, prettyDate } from "../lib/api.js";

const FILTERS = [
  { key: "open", label: "To do" },
  { key: "new", label: "New" },
  { key: "confirmed", label: "Confirmed" },
  { key: "sample_collected", label: "Collected" },
  { key: "report_ready", label: "Report ready" },
  { key: "completed", label: "Completed" },
  { key: "all", label: "All" },
];

export default function BookingsPage({ lab }) {
  const [summary, setSummary] = useState(null);
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);

  const [status, setStatusFilter] = useState("open");
  const [date, setDate] = useState("");
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [working, setWorking] = useState(null); // reference currently being changed
  const [open, setOpen] = useState(null);       // reference whose details are expanded

  // Debounce the search box, so a query doesn't fire on every keystroke.
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(q.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [q]);

  const load = useCallback(async () => {
    setError("");
    try {
      const [list, sum] = await Promise.all([
        getBookings({ status, date, q: search, page, limit: 25 }),
        getSummary(),
      ]);
      setRows(list.bookings);
      setTotal(list.total);
      setPages(list.pages);
      setSummary(sum);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [status, date, search, page]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  async function move(reference, next) {
    setWorking(reference);
    setError("");
    try {
      await setStatus(reference, next);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setWorking(null);
    }
  }

  return (
    <>
      {summary && (
        <div className="tiles">
          <Tile label="Today" value={summary.todayCount} hint={prettyDate(summary.today, lab)} />
          <Tile label="Tomorrow" value={summary.tomorrowCount} />
          <Tile label="Needs attention" value={summary.newCount} accent={summary.newCount > 0} />
        </div>
      )}

      <section className="card">
        <div className="filters">
          <div className="chips" role="group" aria-label="Filter by status">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                className="chip"
                aria-pressed={status === f.key}
                onClick={() => {
                  setStatusFilter(f.key);
                  setPage(1);
                }}
              >
                {f.label}
                {f.key === "new" && summary?.newCount > 0 ? ` (${summary.newCount})` : ""}
              </button>
            ))}
          </div>

          <div className="filter-row">
            <input
              className="input"
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search name, phone or reference"
              aria-label="Search bookings"
            />
            <input
              className="input"
              type="date"
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                setPage(1);
              }}
              aria-label="Filter by date"
            />
            {(date || q) && (
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  setDate("");
                  setQ("");
                  setPage(1);
                }}
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="notice notice-bad" role="alert">
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ padding: 8 }}>
            {[0, 1, 2].map((i) => (
              <div key={i} className="skeleton" style={{ height: 62, marginBottom: 10 }} />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <p className="empty">
            {search || date
              ? "No bookings match what you searched for."
              : status === "open"
                ? "Nothing waiting. Everything is dealt with."
                : "No bookings here yet."}
          </p>
        ) : (
          <>
            <p className="count">
              {total === 1 ? "1 booking" : `${total} bookings`}
            </p>
            <ul className="bookings">
              {rows.map((b) => (
                <BookingRow
                  key={b.reference}
                  booking={b}
                  lab={lab}
                  busy={working === b.reference}
                  expanded={open === b.reference}
                  onToggle={() => setOpen(open === b.reference ? null : b.reference)}
                  onMove={move}
                  onSaved={load}
                />
              ))}
            </ul>

            {pages > 1 && (
              <div className="pager">
                <button
                  type="button"
                  className="btn btn-ghost"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </button>
                <span className="muted small">Page {page} of {pages}</span>
                <button
                  type="button"
                  className="btn btn-ghost"
                  disabled={page >= pages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </>
  );
}

function Tile({ label, value, hint, accent }) {
  return (
    <div className={`tile${accent ? " tile-accent" : ""}`}>
      <span className="tile-label">{label}</span>
      <strong className="tile-value">{value}</strong>
      {hint && <span className="tile-hint">{hint}</span>}
    </div>
  );
}

function BookingRow({ booking: b, lab, busy, expanded, onToggle, onMove, onSaved }) {
  const next = NEXT_STATUS[b.status];
  const [notes, setNotes] = useState(b.labNotes || "");
  const [savingNotes, setSavingNotes] = useState(false);
  const [noteError, setNoteError] = useState("");

  useEffect(() => {
    setNotes(b.labNotes || "");
  }, [b.labNotes]);

  async function saveNotes() {
    setSavingNotes(true);
    setNoteError("");
    try {
      await setLabNotes(b.reference, notes);
      onSaved?.();
    } catch (err) {
      setNoteError(err.message);
    } finally {
      setSavingNotes(false);
    }
  }

  return (
    <li className={`booking status-${b.status}`}>
      <div className="booking-main">
        <button type="button" className="booking-head" onClick={onToggle} aria-expanded={expanded}>
          <span className="booking-who">
            <strong>{b.patient.name}</strong>
            <span className="muted small">
              {b.patient.age} {b.patient.gender} · {b.patient.phone}
            </span>
          </span>
          <span className="booking-meta">
            <span className={`pill pill-${b.status}`}>{STATUS_LABELS[b.status]}</span>
            <span className="muted tiny">
              {b.date ? prettyDate(b.date, lab) : "No date"}
              {b.slot ? `, ${b.slot}` : ""}
            </span>
          </span>
        </button>

        <div className="booking-actions">
          {next && (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              disabled={busy}
              onClick={() => onMove(b.reference, next)}
            >
              {busy ? "Saving…" : `Mark ${STATUS_LABELS[next].toLowerCase()}`}
            </button>
          )}
          <a className="btn btn-ghost btn-sm" href={`tel:${b.patient.phone}`}>Call</a>
        </div>
      </div>

      {expanded && (
        <div className="booking-detail">
          <dl>
            <dt>Reference</dt>
            <dd className="mono">{b.reference}</dd>

            <dt>Tests</dt>
            <dd>{b.items.map((i) => i.name).join(", ") || "As per notes"}</dd>

            <dt>Sample</dt>
            <dd>{b.visitType === "home" ? "Home collection" : "At the lab"}</dd>

            {b.visitType === "home" && b.address && (
              <>
                <dt>Address</dt>
                <dd>{b.address}</dd>
              </>
            )}

            {b.estimatedTotal !== null && (
              <>
                <dt>Estimated</dt>
                <dd>{money(b.estimatedTotal, lab)}</dd>
              </>
            )}

            {b.notes && (
              <>
                <dt>Patient note</dt>
                <dd>{b.notes}</dd>
              </>
            )}

            <dt>Booked</dt>
            <dd>{new Date(b.createdAt).toLocaleString(lab?.locale || "en-IN")}</dd>
          </dl>

          <div className="notes-box">
            <label className="field-label" htmlFor={`n-${b.reference}`}>
              Your notes <span className="muted">(the patient never sees these)</span>
            </label>
            <textarea
              id={`n-${b.reference}`}
              className="textarea"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Anything your staff should know"
            />
            {noteError && <p className="err">{noteError}</p>}
            <div className="row-gap">
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                disabled={savingNotes || notes === (b.labNotes || "")}
                onClick={saveNotes}
              >
                {savingNotes ? "Saving…" : "Save notes"}
              </button>

              {b.status !== "cancelled" && (
                <button
                  type="button"
                  className="btn btn-ghost btn-sm btn-danger"
                  disabled={busy}
                  onClick={() => onMove(b.reference, "cancelled")}
                >
                  Cancel booking
                </button>
              )}
              {b.status !== "no_show" && b.status !== "cancelled" && (
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  disabled={busy}
                  onClick={() => onMove(b.reference, "no_show")}
                >
                  Did not attend
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </li>
  );
}
