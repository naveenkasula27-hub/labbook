import { useEffect, useState } from "react";
import { getSettings, updateSettings } from "../lib/dash.js";

const DAYS = [
  { n: 1, label: "Mon" },
  { n: 2, label: "Tue" },
  { n: 3, label: "Wed" },
  { n: 4, label: "Thu" },
  { n: 5, label: "Fri" },
  { n: 6, label: "Sat" },
  { n: 0, label: "Sun" },
];

export default function SettingsPage({ onSaved }) {
  const [lab, setLab] = useState(null);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");

  useEffect(() => {
    getSettings()
      .then((d) => {
        setLab(d.lab);
        setForm(shape(d.lab));
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  function shape(l) {
    return {
      tagline: l.tagline || "",
      about: l.about || "",
      phone: l.phone || "",
      whatsapp: l.whatsapp || "",
      email: l.email || "",
      address: l.address || "",
      city: l.city || "",
      mapsUrl: l.mapsUrl || "",
      homeCollection: !!l.homeCollection,
      homeCollectionFee: l.homeCollectionFee ?? 0,
      homeCollectionNote: l.homeCollectionNote || "",
      openDays: [...(l.openDays || [])],
      slots: (l.slots || []).map((s) => ({ ...s })),
      notify: { ...(l.notify || {}) },
    };
  }

  const set = (field) => (e) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [field]: value }));
    setSaved("");
  };

  function toggleDay(n) {
    setForm((f) => {
      const has = f.openDays.includes(n);
      const openDays = has ? f.openDays.filter((d) => d !== n) : [...f.openDays, n];
      return { ...f, openDays: openDays.sort() };
    });
    setSaved("");
  }

  function setSlot(i, field, value) {
    setForm((f) => {
      const slots = f.slots.map((s, idx) => (idx === i ? { ...s, [field]: value } : s));
      return { ...f, slots };
    });
    setSaved("");
  }

  function addSlot() {
    setForm((f) => ({
      ...f,
      slots: [...f.slots, { label: "", start: "09:00", end: "13:00", capacity: 20 }],
    }));
  }

  function removeSlot(i) {
    setForm((f) => ({ ...f, slots: f.slots.filter((_, idx) => idx !== i) }));
  }

  async function save(e) {
    e.preventDefault();
    setError("");
    setSaved("");

    if (form.openDays.length === 0) {
      return setError("Pick at least one day you are open.");
    }
    if (form.slots.length === 0) {
      return setError("You need at least one time slot.");
    }
    for (const s of form.slots) {
      if (!s.label.trim()) return setError("Every time slot needs a name.");
      if (!/^\d{2}:\d{2}$/.test(s.start) || !/^\d{2}:\d{2}$/.test(s.end)) {
        return setError(`Check the times on "${s.label || "the new slot"}".`);
      }
      if (s.start >= s.end) {
        return setError(`"${s.label}" ends before it starts.`);
      }
      if (!(Number(s.capacity) >= 1)) {
        return setError(`"${s.label}" needs a capacity of at least 1.`);
      }
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        homeCollectionFee: Number(form.homeCollectionFee) || 0,
        slots: form.slots.map((s) => ({
          label: s.label.trim(),
          start: s.start,
          end: s.end,
          capacity: Number(s.capacity),
        })),
      };
      const res = await updateSettings(payload);
      setLab(res.lab);
      setForm(shape(res.lab));
      setSaved("Saved.");
      onSaved?.(res.lab);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <section className="card">
        <div className="skeleton" style={{ height: 200 }} />
      </section>
    );
  }

  if (!form) {
    return (
      <section className="card">
        <div className="notice notice-bad">{error || "Could not load your settings."}</div>
      </section>
    );
  }

  return (
    <form onSubmit={save}>
      {error && <div className="notice notice-bad" role="alert">{error}</div>}
      {saved && <div className="notice notice-ok" role="status">{saved}</div>}

      <section className="card">
        <h2>About the lab</h2>
        <div className="form">
          <div>
            <label className="field-label" htmlFor="tagline">Tagline</label>
            <input id="tagline" className="input" value={form.tagline} onChange={set("tagline")} maxLength={160} />
            <p className="muted tiny" style={{ margin: "4px 0 0" }}>
              Shown under your name on the booking page.
            </p>
          </div>
          <div>
            <label className="field-label" htmlFor="about">About</label>
            <textarea id="about" className="textarea" value={form.about} onChange={set("about")} maxLength={1000} />
          </div>
        </div>
      </section>

      <section className="card">
        <h2>Contact</h2>
        <div className="form">
          <div className="two">
            <div>
              <label className="field-label" htmlFor="phone">Phone shown to patients</label>
              <input id="phone" className="input" value={form.phone} onChange={set("phone")} />
            </div>
            <div>
              <label className="field-label" htmlFor="whatsapp">WhatsApp number</label>
              <input
                id="whatsapp"
                className="input"
                value={form.whatsapp}
                onChange={set("whatsapp")}
                placeholder="919949070916"
              />
              <p className="muted tiny" style={{ margin: "4px 0 0" }}>
                With country code, digits only. Booking alerts go here.
              </p>
            </div>
          </div>
          <div>
            <label className="field-label" htmlFor="email">Email</label>
            <input id="email" className="input" type="email" value={form.email} onChange={set("email")} />
          </div>
          <div>
            <label className="field-label" htmlFor="address">Address</label>
            <textarea id="address" className="textarea" value={form.address} onChange={set("address")} maxLength={300} />
          </div>
          <div className="two">
            <div>
              <label className="field-label" htmlFor="city">Town or city</label>
              <input id="city" className="input" value={form.city} onChange={set("city")} />
            </div>
            <div>
              <label className="field-label" htmlFor="mapsUrl">Google Maps link</label>
              <input id="mapsUrl" className="input" value={form.mapsUrl} onChange={set("mapsUrl")} placeholder="https://..." />
            </div>
          </div>
        </div>
      </section>

      <section className="card">
        <h2>Home sample collection</h2>
        <div className="form">
          <label className="check">
            <input type="checkbox" checked={form.homeCollection} onChange={set("homeCollection")} />
            <span>Offer home collection</span>
          </label>

          {form.homeCollection && (
            <>
              <div>
                <label className="field-label" htmlFor="fee">Collection charge</label>
                <input
                  id="fee"
                  className="input"
                  type="number"
                  min="0"
                  value={form.homeCollectionFee}
                  onChange={set("homeCollectionFee")}
                />
                <p className="muted tiny" style={{ margin: "4px 0 0" }}>
                  Added to the estimate on home bookings. Put 0 for free.
                </p>
              </div>
              <div>
                <label className="field-label" htmlFor="hcnote">Note about collection</label>
                <input
                  id="hcnote"
                  className="input"
                  value={form.homeCollectionNote}
                  onChange={set("homeCollectionNote")}
                  maxLength={200}
                  placeholder="Free within 5 km"
                />
              </div>
            </>
          )}
        </div>
      </section>

      <section className="card">
        <h2>Opening days</h2>
        <div className="radios">
          {DAYS.map((d) => (
            <label className="radio" key={d.n}>
              <input
                type="checkbox"
                checked={form.openDays.includes(d.n)}
                onChange={() => toggleDay(d.n)}
              />
              {d.label}
            </label>
          ))}
        </div>
        <p className="muted tiny" style={{ marginTop: 8 }}>
          Patients cannot pick a date on a day you are closed.
        </p>
      </section>

      <section className="card">
        <h2>Time slots</h2>
        <p className="muted small">
          How many bookings you can take in each part of the day. When a slot is full it stops
          being offered.
        </p>

        <ul className="slots-edit">
          {form.slots.map((s, i) => (
            <li key={i}>
              <input
                className="input"
                value={s.label}
                onChange={(e) => setSlot(i, "label", e.target.value)}
                placeholder="Morning"
                aria-label={`Slot ${i + 1} name`}
              />
              <input
                className="input"
                type="time"
                value={s.start}
                onChange={(e) => setSlot(i, "start", e.target.value)}
                aria-label={`Slot ${i + 1} start`}
              />
              <input
                className="input"
                type="time"
                value={s.end}
                onChange={(e) => setSlot(i, "end", e.target.value)}
                aria-label={`Slot ${i + 1} end`}
              />
              <input
                className="input"
                type="number"
                min="1"
                value={s.capacity}
                onChange={(e) => setSlot(i, "capacity", e.target.value)}
                aria-label={`Slot ${i + 1} capacity`}
              />
              {form.slots.length > 1 && (
                <button type="button" className="link-btn" onClick={() => removeSlot(i)}>
                  Remove
                </button>
              )}
            </li>
          ))}
        </ul>

        {form.slots.length < 10 && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={addSlot}>
            Add a slot
          </button>
        )}
      </section>

      <section className="card">
        <h2>Alerts</h2>
        <div className="form">
          <label className="check">
            <input
              type="checkbox"
              checked={!!form.notify.whatsappOnBooking}
              onChange={(e) =>
                setForm((f) => ({ ...f, notify: { ...f.notify, whatsappOnBooking: e.target.checked } }))
              }
            />
            <span>Send me a WhatsApp message for every new booking</span>
          </label>
          <label className="check">
            <input
              type="checkbox"
              checked={!!form.notify.reminderDayBefore}
              onChange={(e) =>
                setForm((f) => ({ ...f, notify: { ...f.notify, reminderDayBefore: e.target.checked } }))
              }
            />
            <span>Remind patients the day before their appointment</span>
          </label>
          <p className="muted tiny" style={{ margin: 0 }}>
            Reminders are not switched on yet. This setting is saved for when they are.
          </p>
        </div>
      </section>

      <div className="save-bar">
        <button className="btn btn-primary" type="submit" disabled={saving}>
          {saving ? "Saving…" : "Save settings"}
        </button>
      </div>
    </form>
  );
}
