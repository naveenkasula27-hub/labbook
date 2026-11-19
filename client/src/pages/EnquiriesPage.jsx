import { useCallback, useEffect, useState } from "react";
import { getEnquiries, updateEnquiry } from "../lib/dash.js";

export default function EnquiriesPage({ lab }) {
  const [status, setStatus] = useState("new");
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [working, setWorking] = useState("");
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const result = await getEnquiries(status, page);
      if (page > result.pages) { setPage(result.pages); return; }
      setData(result);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, [status, page]);
  useEffect(() => { load(); }, [load]);
  async function change(id, next) {
    setWorking(id); setError("");
    try { await updateEnquiry(id, next); await load(); }
    catch (err) { setError(err.message); }
    finally { setWorking(""); }
  }
  return <section className="callback-inbox">
    <h2>Callback requests</h2><p className="muted">People asking {lab.name} for help choosing or booking a test. A callback request does not reserve an appointment.</p>
    <div className="chips" role="group" aria-label="Callback status">{["new", "contacted", "closed", "all"].map((value) => <button type="button" className="chip" key={value} aria-pressed={status === value} onClick={() => { setStatus(value); setPage(1); }}>{value === "new" ? "Needs a call" : value[0].toUpperCase() + value.slice(1)}</button>)}</div>
    {error && <p className="err" role="alert">{error} <button type="button" className="link-btn" onClick={load}>Try again</button></p>}
    {loading ? <p role="status">Loading requests…</p> : data && <>
      <p className="muted small" role="status">{data.total} {data.total === 1 ? "request" : "requests"}</p>
      {!data.rows.length && <div className="card"><h3>No requests here yet</h3><p>New callback requests will appear here when someone submits the help form on your booking page.</p></div>}
      {data.rows.map((row) => <article className="card" key={row._id}>
        <h3>{row.name}</h3><p><a href={`tel:+${row.phone}`}>+{row.phone}</a></p>
        <p className="muted small">{row.reference} · {new Intl.DateTimeFormat(lab.locale || "en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: lab.timezone || "Asia/Kolkata" }).format(new Date(row.createdAt))}</p>
        {row.message && <p>{row.message}</p>}
        <label className="field-label" htmlFor={`callback-${row._id}`}>Request status</label>
        <select className="select" id={`callback-${row._id}`} value={row.status} disabled={Boolean(working)} onChange={(event) => change(row._id, event.target.value)}>
          <option value="new">Needs a call</option><option value="contacted">Contacted</option><option value="closed">Closed</option>
        </select>
        {working === row._id && <p role="status">Saving…</p>}
      </article>)}
      {data.pages > 1 && <nav className="test-pager" aria-label="Callback pages"><button type="button" className="btn btn-ghost" disabled={page === 1} onClick={() => setPage((value) => value - 1)}>Previous</button><span>Page {page} of {data.pages}</span><button type="button" className="btn btn-ghost" disabled={page === data.pages} onClick={() => setPage((value) => value + 1)}>Next</button></nav>}
    </>}
  </section>;
}
